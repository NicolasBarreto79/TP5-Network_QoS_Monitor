import { RadioDetails, ConnectionType } from '@qos-monitor/contracts';

interface NativeTelephonyResponse {
  operatorName?: string;
  simOperator?: string;
  mcc?: string | null;
  mnc?: string | null;
  isRoaming?: boolean;
  networkType?: string;
  rssiDbm?: number;
  rsrpDbm?: number | null;
  rsrqDb?: number | null;
  sinrDb?: number | null;
  asuLevel?: number | null;
  cellId?: number | null;
  lacTac?: number | null;
  band?: string | null;
}

let TelephonyModule: any = null;
try {
  // Dynamic require to prevent Node test runner syntax errors with raw Flow
  const rn = require('react-native');
  TelephonyModule = rn.NativeModules?.TelephonyModule;
} catch {
  // Node / test environment fallback
}

export class TelephonyBridge {
  private static mockConnectionType: ConnectionType = '4g';
  private static mockRadioState: RadioDetails = {
    operatorName: 'Personal 4G',
    simState: 'READY',
    mcc: '722',
    mnc: '34',
    rssiDbm: -78,
    rsrpDbm: -88,
    rsrqDb: -9,
    sinrDb: 21,
    asuLevel: 52,
    cellId: 108420,
    lacTac: 4102,
    band: 'B28 (700 MHz)',
    isRoaming: false,
  };

  /**
   * Fetches cellular radio parameters from native TelephonyManager (Android) or CoreTelephony (iOS)
   */
  static async getCellularInfo(): Promise<{
    radio: RadioDetails;
    connectionType: ConnectionType;
  }> {
    if (TelephonyModule && typeof TelephonyModule.getCellularNetworkInfo === 'function') {
      try {
        const raw: NativeTelephonyResponse = await TelephonyModule.getCellularNetworkInfo();

        const typeStr = (raw.networkType || '4g').toLowerCase();
        const connectionType: ConnectionType = 
          typeStr.includes('5g') ? '5g' :
          typeStr.includes('4g') || typeStr.includes('lte') ? '4g' :
          typeStr.includes('3g') ? '3g' :
          typeStr.includes('2g') ? '2g' : 'unknown';

        const radio: RadioDetails = {
          operatorName: raw.operatorName || 'Desconocido',
          simState: 'READY',
          mcc: raw.mcc || null,
          mnc: raw.mnc || null,
          rssiDbm: raw.rssiDbm ?? -85,
          rsrpDbm: raw.rsrpDbm ?? null,
          rsrqDb: raw.rsrqDb ?? null,
          sinrDb: raw.sinrDb ?? null,
          asuLevel: raw.asuLevel ?? null,
          cellId: raw.cellId ?? null,
          lacTac: raw.lacTac ?? null,
          band: raw.band || null,
          isRoaming: Boolean(raw.isRoaming),
        };

        return { radio, connectionType };
      } catch (err) {
        console.warn('[TelephonyBridge] Error al invocar módulo nativo, usando fallback:', err);
      }
    }

    // Fallback para entornos de desarrollo / emulador / web / pruebas
    return {
      radio: { ...this.mockRadioState },
      connectionType: this.mockConnectionType,
    };
  }

  /**
   * Permite inyectar valores para simulación de escenarios de prueba (ej. degradación forzada)
   */
  static setMockScenario(scenario: 'EXCELLENT_5G' | 'GOOD_4G' | 'WEAK_4G' | 'CRITICAL_3G') {
    switch (scenario) {
      case 'EXCELLENT_5G':
        this.mockConnectionType = '5g';
        this.mockRadioState = {
          operatorName: 'Claro 5G',
          simState: 'READY',
          mcc: '722',
          mnc: '310',
          rssiDbm: -62,
          rsrpDbm: -72,
          rsrqDb: -6,
          sinrDb: 28,
          asuLevel: 68,
          cellId: 982103,
          lacTac: 2010,
          band: 'n78 (3.5 GHz)',
          isRoaming: false,
        };
        break;
      case 'GOOD_4G':
        this.mockConnectionType = '4g';
        this.mockRadioState = {
          operatorName: 'Personal 4G',
          simState: 'READY',
          mcc: '722',
          mnc: '34',
          rssiDbm: -78,
          rsrpDbm: -88,
          rsrqDb: -9,
          sinrDb: 20,
          asuLevel: 52,
          cellId: 108420,
          lacTac: 4102,
          band: 'B28 (700 MHz)',
          isRoaming: false,
        };
        break;
      case 'WEAK_4G':
        this.mockConnectionType = '4g';
        this.mockRadioState = {
          operatorName: 'Movistar 4G',
          simState: 'READY',
          mcc: '722',
          mnc: '07',
          rssiDbm: -108,
          rsrpDbm: -115,
          rsrqDb: -14,
          sinrDb: 2,
          asuLevel: 22,
          cellId: 441029,
          lacTac: 8901,
          band: 'B4 (AWS)',
          isRoaming: false,
        };
        break;
      case 'CRITICAL_3G':
        this.mockConnectionType = '3g';
        this.mockRadioState = {
          operatorName: 'Personal 3G',
          simState: 'READY',
          mcc: '722',
          mnc: '34',
          rssiDbm: -118,
          rsrpDbm: null,
          rsrqDb: null,
          sinrDb: null,
          asuLevel: 10,
          cellId: 12048,
          lacTac: 4100,
          band: 'UMTS 850',
          isRoaming: true,
        };
        break;
    }
  }
}
