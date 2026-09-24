package com.networkqosmonitor.background

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class QoSHeadlessTaskService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras
        val data = if (extras != null) Arguments.fromBundle(extras) else Arguments.createMap()

        return HeadlessJsTaskConfig(
            "QoSBackgroundSamplingTask",
            data,
            30000, // 30 second timeout for probe execution
            true   // Allowed in foreground/background
        )
    }
}
