import { ThroughputResult } from '@qos-monitor/contracts';

export interface ThroughputProgress {
  stage: 'idle' | 'download' | 'upload' | 'completed';
  percent: number; // 0 to 100
  instantSpeedMbps: number;
  transferredBytes: number;
  totalBytes: number;
}

export class ThroughputEngine {
  /**
   * Ejecuta el test de descarga contra el backend de referencia
   */
  static async runDownloadTest(
    backendUrl: string,
    sizeMb = 5,
    onProgress?: (progress: ThroughputProgress) => void
  ): Promise<ThroughputResult> {
    const url = `${backendUrl.replace(/\/$/, '')}/api/download?sizeMb=${sizeMb}`;
    const startTime = performance.now();
    let receivedBytes = 0;
    const totalExpectedBytes = sizeMb * 1024 * 1024;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Error en descarga HTTP: ${response.status} ${response.statusText}`);
    }

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      let lastSampleTime = startTime;
      let lastSampleBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          receivedBytes += value.byteLength;
          const currentTime = performance.now();
          const sampleDurationSec = (currentTime - lastSampleTime) / 1000;

          // Actualizar velocímetro si pasaron al menos 100ms
          if (sampleDurationSec >= 0.1) {
            const bytesInWindow = receivedBytes - lastSampleBytes;
            const instantSpeed = (bytesInWindow * 8) / (sampleDurationSec * 1_000_000);

            if (onProgress) {
              onProgress({
                stage: 'download',
                percent: Math.min(100, Math.round((receivedBytes / totalExpectedBytes) * 100)),
                instantSpeedMbps: Number(instantSpeed.toFixed(2)),
                transferredBytes: receivedBytes,
                totalBytes: totalExpectedBytes,
              });
            }

            lastSampleTime = currentTime;
            lastSampleBytes = receivedBytes;
          }
        }
      }
    } else {
      // Fallback si stream reader no está disponible en el entorno
      const buffer = await response.arrayBuffer();
      receivedBytes = buffer.byteLength;
    }

    const endTime = performance.now();
    const durationMs = Number((endTime - startTime).toFixed(1));
    const durationSeconds = durationMs / 1000;
    const speedMbps = durationSeconds > 0 
      ? Number(((receivedBytes * 8) / (durationSeconds * 1_000_000)).toFixed(2))
      : 0;

    if (onProgress) {
      onProgress({
        stage: 'download',
        percent: 100,
        instantSpeedMbps: speedMbps,
        transferredBytes: receivedBytes,
        totalBytes: totalExpectedBytes,
      });
    }

    return {
      direction: 'download',
      bytesTransferred: receivedBytes,
      durationMs,
      speedMbps,
      serverUrl: url,
      timestamp: Date.now(),
    };
  }

  /**
   * Ejecuta el test de subida (upload echo) contra el backend de referencia
   */
  static async runUploadTest(
    backendUrl: string,
    sizeMb = 2,
    onProgress?: (progress: ThroughputProgress) => void
  ): Promise<ThroughputResult> {
    const url = `${backendUrl.replace(/\/$/, '')}/api/upload`;
    const totalBytes = Math.floor(sizeMb * 1024 * 1024);
    
    // Generar buffer en memoria para subida
    const dummyPayload = new Uint8Array(totalBytes);
    for (let i = 0; i < totalBytes; i += 1024) {
      dummyPayload[i] = 0x5a;
    }

    if (onProgress) {
      onProgress({
        stage: 'upload',
        percent: 10,
        instantSpeedMbps: 0,
        transferredBytes: 0,
        totalBytes,
      });
    }

    const startTime = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      body: dummyPayload,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-cache',
      },
    });

    const endTime = performance.now();
    const durationMs = Number((endTime - startTime).toFixed(1));
    const durationSeconds = durationMs / 1000;
    const speedMbps = durationSeconds > 0
      ? Number(((totalBytes * 8) / (durationSeconds * 1_000_000)).toFixed(2))
      : 0;

    if (!response.ok) {
      throw new Error(`Error en subida HTTP: ${response.status} ${response.statusText}`);
    }

    if (onProgress) {
      onProgress({
        stage: 'upload',
        percent: 100,
        instantSpeedMbps: speedMbps,
        transferredBytes: totalBytes,
        totalBytes,
      });
    }

    return {
      direction: 'upload',
      bytesTransferred: totalBytes,
      durationMs,
      speedMbps,
      serverUrl: url,
      timestamp: Date.now(),
    };
  }
}
