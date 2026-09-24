package com.networkqosmonitor.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.*
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class TelephonyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val telephonyManager: TelephonyManager? =
        reactContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager

    private var telephonyCallback: Any? = null // Supports TelephonyCallback (API 31+) or PhoneStateListener

    override fun getName(): String = "TelephonyModule"

    @ReactMethod
    fun getCellularNetworkInfo(promise: Promise) {
        try {
            if (telephonyManager == null) {
                promise.reject("E_NO_TELEPHONY", "TelephonyManager no disponible en este dispositivo.")
                return
            }

            val map = Arguments.createMap()
            val operatorName = telephonyManager.networkOperatorName.ifEmpty { telephonyManager.simOperatorName }
            val simOperator = telephonyManager.simOperator
            val isRoaming = telephonyManager.isNetworkRoaming

            map.putString("operatorName", operatorName)
            map.putString("simOperator", simOperator)
            map.putBoolean("isRoaming", isRoaming)

            // Parse MCC / MNC
            if (simOperator != null && simOperator.length >= 5) {
                map.putString("mcc", simOperator.substring(0, 3))
                map.putString("mnc", simOperator.substring(3))
            } else {
                map.putNull("mcc")
                map.putNull("mnc")
            }

            // Network Type mapping
            val rawNetworkType = try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    telephonyManager.dataNetworkType
                } else {
                    @Suppress("DEPRECATION")
                    telephonyManager.networkType
                }
            } catch (e: SecurityException) {
                TelephonyManager.NETWORK_TYPE_UNKNOWN
            }

            val typeStr = mapNetworkTypeToString(rawNetworkType)
            map.putString("networkType", typeStr)
            map.putInt("rawNetworkType", rawNetworkType)

            // Check permissions for cell identity and raw signal strength (RSSI/RSRP)
            val hasFineLocation = ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            var rssiDbm = -95 // Standard default fallback
            var rsrpDbm: Int? = null
            var rsrqDb: Int? = null
            var sinrDb: Int? = null
            var asuLevel: Int? = null
            var cellId: Long? = null
            var lacTac: Int? = null
            var band: String? = null

            if (hasFineLocation) {
                val cellInfoList = telephonyManager.allCellInfo
                if (cellInfoList != null && cellInfoList.isNotEmpty()) {
                    val registeredCell = cellInfoList.firstOrNull { it.isRegistered } ?: cellInfoList[0]

                    when (registeredCell) {
                        is CellInfoLte -> {
                            val signal = registeredCell.cellSignalStrength
                            val identity = registeredCell.cellIdentity
                            rssiDbm = signal.dbm
                            asuLevel = signal.asuLevel
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                rsrpDbm = signal.rsrp
                                rsrqDb = signal.rsrq
                                sinrDb = signal.rssnr
                            }
                            cellId = identity.ci.toLong()
                            lacTac = identity.tac
                            band = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && identity.bands.isNotEmpty()) {
                                "B" + identity.bands.joinToString(",")
                            } else {
                                "LTE"
                            }
                        }
                        is CellInfoNr -> {
                            val signal = registeredCell.cellSignalStrength as? CellSignalStrengthNr
                            val identity = registeredCell.cellIdentity as? CellIdentityNr
                            if (signal != null) {
                                rssiDbm = signal.dbm
                                asuLevel = signal.asuLevel
                                rsrpDbm = signal.csiRsrp
                                sinrDb = signal.csiSinr
                            }
                            if (identity != null) {
                                cellId = identity.nci
                                lacTac = identity.tac
                            }
                            band = "5G NR"
                        }
                        is CellInfoWcdma -> {
                            val signal = registeredCell.cellSignalStrength
                            val identity = registeredCell.cellIdentity
                            rssiDbm = signal.dbm
                            asuLevel = signal.asuLevel
                            cellId = identity.cid.toLong()
                            lacTac = identity.lac
                            band = "WCDMA/3G"
                        }
                        is CellInfoGsm -> {
                            val signal = registeredCell.cellSignalStrength
                            val identity = registeredCell.cellIdentity
                            rssiDbm = signal.dbm
                            asuLevel = signal.asuLevel
                            cellId = identity.cid.toLong()
                            lacTac = identity.lac
                            band = "GSM/2G"
                        }
                    }
                }
            }

            map.putInt("rssiDbm", rssiDbm)
            if (rsrpDbm != null) map.putInt("rsrpDbm", rsrpDbm) else map.putNull("rsrpDbm")
            if (rsrqDb != null) map.putInt("rsrqDb", rsrqDb) else map.putNull("rsrqDb")
            if (sinrDb != null) map.putInt("sinrDb", sinrDb) else map.putNull("sinrDb")
            if (asuLevel != null) map.putInt("asuLevel", asuLevel) else map.putNull("asuLevel")
            if (cellId != null) map.putDouble("cellId", cellId.toDouble()) else map.putNull("cellId")
            if (lacTac != null) map.putInt("lacTac", lacTac) else map.putNull("lacTac")
            if (band != null) map.putString("band", band) else map.putNull("band")

            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("E_TELEPHONY_ERROR", e.localizedMessage, e)
        }
    }

    private fun mapNetworkTypeToString(type: Int): String {
        return when (type) {
            TelephonyManager.NETWORK_TYPE_NR -> "5g"
            TelephonyManager.NETWORK_TYPE_LTE -> "4g"
            TelephonyManager.NETWORK_TYPE_HSPAP,
            TelephonyManager.NETWORK_TYPE_HSPA,
            TelephonyManager.NETWORK_TYPE_HSDPA,
            TelephonyManager.NETWORK_TYPE_HSUPA,
            TelephonyManager.NETWORK_TYPE_UMTS -> "3g"
            TelephonyManager.NETWORK_TYPE_EDGE,
            TelephonyManager.NETWORK_TYPE_GPRS,
            TelephonyManager.NETWORK_TYPE_CDMA -> "2g"
            else -> "unknown"
        }
    }
}
