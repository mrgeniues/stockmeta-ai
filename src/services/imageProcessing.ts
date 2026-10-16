import { PngBackground } from '../types';

export interface PreparedInlineData {
  mime_type: string;
  data: string; // base64 without data: prefix
}

/**
 * Capture a single video poster frame thumbnail for the UI list
 */
/**
 * Analyze a canvas context to detect if a frame is completely black, blank, or an empty/unrendered canvas.
 * Samples a 25x25 grid of pixels (625 sample points) for ultra-fast, zero-overhead evaluation.
 */
export function isFrameBlackOrBlank(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold = 22,
  minNonBlackRatio = 0.025
): boolean {
  try {
    const sampleStepX = Math.max(1, Math.floor(width / 25));
    const sampleStepY = Math.max(1, Math.floor(height / 25));
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalLuminance = 0;
    let sampledPixels = 0;
    let nonBlackPixels = 0;
    let maxPixelLum = 0;

    for (let y = 0; y < height; y += sampleStepY) {
      for (let x = 0; x < width; x += sampleStepX) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        // If transparent, consider blank
        if (a < 40) continue;
        // Standard Rec. 601 perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        sampledPixels++;
        if (lum > maxPixelLum) {
          maxPixelLum = lum;
        }
        if (lum > threshold) {
          nonBlackPixels++;
        }
      }
    }

    if (sampledPixels === 0) return true;
    const avgLum = totalLuminance / sampledPixels;
    const nonBlackRatio = nonBlackPixels / sampledPixels;

    // A frame is black/blank if:
    // 1) Peak luminance across all samples is very low (<= 22, e.g. dark studio black / blank texture)
    // 2) Or average luminance is <= 12 AND non-black ratio < 2.5%
    if (maxPixelLum <= threshold) {
      return true;
    }
    if (avgLum <= 12 && nonBlackRatio < minNonBlackRatio) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Safely seek an HTMLVideoElement to targetTime and ensure the decoded frame buffer
 * is ready for canvas rendering (especially on high-res 4K files or asynchronous GPU decoders).
 */
async function seekVideoToTime(
  video: HTMLVideoElement,
  targetTime: number,
  timeoutMs = 2500
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    const done = async (success: boolean) => {
      if (finished) return;
      finished = true;
      cleanup();

      if (success) {
        // Wait for video decoder to submit frame to composition pipeline
        try {
          if ('requestVideoFrameCallback' in video && typeof (video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback === 'function') {
            await new Promise<void>((r) => {
              (video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(() => r());
              setTimeout(r, 90);
            });
          } else {
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
          }
        } catch {
          // ignore
        }
      }
      resolve(success);
    };

    timer = setTimeout(() => {
      console.warn(`[captureVideo] Seek to ${targetTime}s reached timeout (${timeoutMs}ms, readyState=${video.readyState})`);
      done(video.readyState >= 2);
    }, timeoutMs);

    const onSeeked = () => {
      if (video.readyState >= 2) {
        done(true);
      } else {
        const onReady = () => {
          video.removeEventListener('canplay', onReady);
          video.removeEventListener('loadeddata', onReady);
          done(true);
        };
        video.addEventListener('canplay', onReady, { once: true });
        video.addEventListener('loadeddata', onReady, { once: true });
        setTimeout(() => done(video.readyState >= 1), 350);
      }
    };

    const onError = () => {
      done(false);
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });

    try {
      video.currentTime = targetTime;
    } catch {
      done(false);
    }
  });
}

/**
 * Fast seek helper tailored specifically for quick video poster frame extraction.
 * Bypasses long compositional delays to keep thumbnail generation blazing fast.
 */
function fastSeekPoster(video: HTMLVideoElement, targetTime: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((res) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        cleanup();
        res(video.readyState >= 2);
      }
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    const onSeeked = () => {
      if (!done) {
        done = true;
        cleanup();
        res(true);
      }
    };

    const onError = () => {
      if (!done) {
        done = true;
        cleanup();
        res(false);
      }
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });

    try {
      video.currentTime = targetTime;
    } catch {
      if (!done) {
        done = true;
        cleanup();
        res(false);
      }
    }
  });
}

/**
 * Capture a single lightweight video poster frame thumbnail for the UI list.
 * Automatically avoids black slates / intro fade-ins by testing luminance.
 * Downscales to small thumbnail size (max 320px) and releases the video decoder immediately.
 */
export async function captureVideoPoster(file: File, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve('');
      return;
    }

    let resolved = false;
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      try {
        video.onloadedmetadata = null;
        video.onerror = null;
        URL.revokeObjectURL(url);
        video.pause();
        video.removeAttribute('src');
        video.src = '';
        video.load();
        video.remove();
      } catch {
        // ignore
      }
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            cleanup();
            resolve('');
          }
        },
        { once: true }
      );
    }

    // Safety timeout: 3.5 seconds maximum per poster job
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve('');
      }
    }, 3500);

    const drawPosterCanvas = (): { dataUrl: string; isBlack: boolean } => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let w = video.videoWidth || 320;
        let h = video.videoHeight || 180;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const isBlack = isFrameBlackOrBlank(ctx, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
          return { dataUrl, isBlack };
        }
      } catch {
        // ignore
      }
      return { dataUrl: '', isBlack: true };
    };

    video.onloadedmetadata = async () => {
      try {
        if (signal?.aborted) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            cleanup();
            resolve('');
          }
          return;
        }

        const duration = video.duration && isFinite(video.duration) ? video.duration : 6;
        // Start probe at ~15% or 0.8s
        const initialSeek = Math.min(Math.max(0.6, duration * 0.15), Math.max(0.6, duration - 0.2));
        await fastSeekPoster(video, initialSeek, 1000);

        if (signal?.aborted) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            cleanup();
            resolve('');
          }
          return;
        }

        let { dataUrl, isBlack } = drawPosterCanvas();

        // If the initial poster frame is black/blank and video is longer than 2.0s,
        // seek deeper into the video (e.g. 45% or 50%) to capture genuine visual content!
        if (isBlack && duration > 2.0) {
          const alternateSeek = Math.min(duration * 0.45, duration - 0.5);
          await fastSeekPoster(video, alternateSeek, 1000);

          if (signal?.aborted) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              cleanup();
              resolve('');
            }
            return;
          }

          const secondResult = drawPosterCanvas();
          if (secondResult.dataUrl && !secondResult.isBlack) {
            dataUrl = secondResult.dataUrl;
          } else if (secondResult.dataUrl && !dataUrl) {
            dataUrl = secondResult.dataUrl;
          }
        }

        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve(dataUrl);
        }
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve('');
        }
      }
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve('');
      }
    };

    video.src = url;
    video.load();
  });
}

/**
 * Extract MULTIPLE representative frames across the video's duration
 * (at least start, middle, and end; more for longer videos ~1 frame every 2-3s up to 8 frames)
 * using HTML5 Video + Canvas.
 * Automatically detects and discards black slates, camera lead-ins, or blank frames.
 */
export async function captureVideoFrames(file: File): Promise<PreparedInlineData[]> {
  return new Promise((resolve) => {
    let resolved = false;
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
        video.src = '';
        video.remove();
      } catch {
        // ignore
      }
    };

    // Candidate frames with black detection flag
    const candidates: Array<{ frame: PreparedInlineData; isBlack: boolean; time: number }> = [];

    // Overall timeout: 15 seconds maximum for multi-frame extraction
    const overallTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        const nonBlack = candidates.filter((c) => !c.isBlack).map((c) => c.frame);
        const result = nonBlack.length > 0 ? nonBlack : candidates.map((c) => c.frame);
        console.warn(`[captureVideoFrames] Overall timeout reached for "${file.name}". Returning ${result.length} frames.`);
        resolve(result);
      }
    }, 15000);

    const doExtraction = async () => {
      try {
        let duration = video.duration;

        // If duration is not finite, wait briefly
        if (!duration || isNaN(duration) || duration <= 0 || !isFinite(duration)) {
          await new Promise((r) => setTimeout(r, 400));
          duration = video.duration;
        }

        if (!duration || isNaN(duration) || duration <= 0 || !isFinite(duration)) {
          duration = 6;
        }

        console.log(`[captureVideoFrames] Video duration: ${duration.toFixed(2)}s for "${file.name}"`);

        // Determine number of frames:
        // - Short clips (<= 3s): 3 frames
        // - Medium clips (4-8s): 4 frames
        // - Longer clips (9-18s): 5 frames
        // - Extended clips (19-35s): 6 frames
        // - 35s+: 7-8 frames
        let targetCount = 3;
        if (duration <= 3.5) {
          targetCount = 3;
        } else if (duration <= 8) {
          targetCount = 4;
        } else if (duration <= 18) {
          targetCount = 5;
        } else if (duration <= 35) {
          targetCount = 6;
        } else {
          targetCount = 8;
        }

        // Generate timestamps spanning from ~12-15% through ~88-92%
        // This avoids initial 0.0s-0.5s camera slates / black clicks
        const startSec = Math.max(0.6, duration * 0.12);
        const endSec = Math.min(duration - 0.3, duration * 0.90);
        const timestamps: number[] = [];

        if (targetCount <= 1 || endSec <= startSec) {
          timestamps.push(duration * 0.5);
        } else {
          const step = (endSec - startSec) / (targetCount - 1);
          for (let i = 0; i < targetCount; i++) {
            timestamps.push(Number((startSec + i * step).toFixed(2)));
          }
        }

        // Track sampled timestamps to prevent duplicates
        const sampledTimes = new Set<string>();

        // Reusable helper to capture and evaluate a frame at any given timestamp
        const captureFrameAt = async (
          targetTime: number
        ): Promise<{ frame: PreparedInlineData; isBlack: boolean; time: number } | null> => {
          sampledTimes.add(targetTime.toFixed(1));
          const seekSuccess = await seekVideoToTime(video, targetTime, 2500);
          if (!seekSuccess) {
            console.warn(`[captureVideoFrames] Seek to ${targetTime}s incomplete, attempting draw anyway`);
          }

          try {
            const canvas = document.createElement('canvas');
            let w = video.videoWidth || 640;
            let h = video.videoHeight || 360;
            const maxDim = 840; // High clarity for Gemini vision while keeping payload compact
            if (w > maxDim || h > maxDim) {
              if (w >= h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = Math.max(1, w);
            canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.drawImage(video, 0, 0, w, h);
            let isBlack = isFrameBlackOrBlank(ctx, w, h);

            // If frame appears black on 4K video, micro-delay and re-draw once in case texture was decoding asynchronously
            if (isBlack) {
              await new Promise((r) => setTimeout(r, 90));
              ctx.drawImage(video, 0, 0, w, h);
              isBlack = isFrameBlackOrBlank(ctx, w, h);
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const base64 = dataUrl.split(',')[1] || '';
            if (!base64) return null;

            return {
              frame: {
                mime_type: 'image/jpeg',
                data: base64,
              },
              isBlack,
              time: targetTime,
            };
          } catch (drawErr) {
            console.warn(`[captureVideoFrames] Error drawing frame at ${targetTime}s:`, drawErr);
            return null;
          }
        };

        // 1. Initial chronological sampling
        for (let i = 0; i < timestamps.length; i++) {
          if (resolved) break;
          const targetTime = timestamps[i];
          const result = await captureFrameAt(targetTime);
          if (result) {
            candidates.push(result);
            console.log(`[captureVideoFrames] Sampled frame at ${targetTime}s (isBlack=${result.isBlack})`);
          }
        }

        // 2. RESAMPLING LOOP FOR BLACK FRAMES (first, middle, or end):
        // If any sampled frames were black and non-black count < Math.min(3, targetCount),
        // resample at alternate midpoints and offsets in a bounded loop until at least 3 non-black frames
        // are collected (or bounded extra attempts exhausted).
        const targetNonBlack = Math.min(3, targetCount);
        let nonBlackCount = candidates.filter((c) => !c.isBlack).length;
        const maxExtraResamples = 5;
        let extraAttempts = 0;

        if (nonBlackCount < targetNonBlack && !resolved) {
          console.log(
            `[captureVideoFrames] Only ${nonBlackCount}/${targetNonBlack} non-black frames collected. Starting bounded resampling loop for black frames...`
          );

          // Build queue of candidate alternate timestamps
          const probeQueue: number[] = [];

          // (a) Midpoints between consecutive existing timestamps
          for (let i = 0; i < timestamps.length - 1; i++) {
            const mid = Number(((timestamps[i] + timestamps[i + 1]) / 2).toFixed(2));
            if (!sampledTimes.has(mid.toFixed(1)) && mid >= startSec && mid <= endSec) {
              probeQueue.push(mid);
            }
          }

          // (b) Additional proportional probe points across duration if still needed
          const standardFractions = [0.2, 0.35, 0.5, 0.65, 0.8];
          for (const frac of standardFractions) {
            const t = Number(Math.max(startSec, Math.min(endSec, duration * frac)).toFixed(2));
            if (!sampledTimes.has(t.toFixed(1)) && !probeQueue.includes(t)) {
              probeQueue.push(t);
            }
          }

          for (const probeTime of probeQueue) {
            if (resolved) break;
            if (nonBlackCount >= targetNonBlack || extraAttempts >= maxExtraResamples) {
              break;
            }
            extraAttempts++;
            console.log(
              `[captureVideoFrames] Resampling alternate timestamp ${probeTime}s (attempt ${extraAttempts}/${maxExtraResamples}, current nonBlack=${nonBlackCount})...`
            );

            const result = await captureFrameAt(probeTime);
            if (result) {
              candidates.push(result);
              if (!result.isBlack) {
                nonBlackCount++;
                console.log(
                  `[captureVideoFrames] Resample at ${probeTime}s succeeded with non-black content! Non-black count: ${nonBlackCount}`
                );
              } else {
                console.log(`[captureVideoFrames] Resampled frame at ${probeTime}s is also black/slate`);
              }
            }
          }
        }

        if (!resolved) {
          resolved = true;
          clearTimeout(overallTimer);
          cleanup();

          // CRITICAL: Filter out black/blank frames when content frames exist!
          // Black frames must NEVER be sent to the model when content frames exist.
          const contentFrames = candidates.filter((c) => !c.isBlack);
          let finalFrames: PreparedInlineData[] = [];

          if (contentFrames.length > 0) {
            const discardedCount = candidates.length - contentFrames.length;
            if (discardedCount > 0) {
              console.log(
                `[captureVideoFrames] Successfully discarded ${discardedCount} black/slate frames. Retaining ${contentFrames.length} real content frames.`
              );
            }
            // Sort content frames chronologically by timestamp
            contentFrames.sort((a, b) => a.time - b.time);
            finalFrames = contentFrames.map((c) => c.frame);
          } else {
            // ZERO non-black frames exist across all timestamps and resample probes (genuinely all-black video)
            console.log(
              `[captureVideoFrames] All ${candidates.length} sampled frames are black/blank for "${file.name}". Zero non-black frames found.`
            );
            // Return empty array so caller (generateMetadataForFile) falls back to captureVideoPoster thumbnail
            finalFrames = [];
          }

          console.log(`[captureVideoFrames] Successfully extracted ${finalFrames.length} frames for "${file.name}"`);
          resolve(finalFrames);
        }
      } catch (err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(overallTimer);
          cleanup();
          console.warn(`[captureVideoFrames] Exception during extraction for "${file.name}":`, err);
          const nonBlack = candidates.filter((c) => !c.isBlack).map((c) => c.frame);
          resolve(nonBlack.length > 0 ? nonBlack : candidates.map((c) => c.frame));
        }
      }
    };

    if (video.readyState >= 1) {
      doExtraction();
    } else {
      video.onloadedmetadata = () => {
        doExtraction();
      };
    }

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(overallTimer);
        cleanup();
        resolve([]);
      }
    };

    // Attach listeners BEFORE setting src, then load
    video.src = url;
    video.load();
  });
}

/**
 * Load image from file (including SVG) into an HTMLImageElement with timeout
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const img = new Image();
    const url = URL.createObjectURL(file);

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        URL.revokeObjectURL(url);
        reject(new Error('Timeout loading image file'));
      }
    }, 6000);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image file'));
      }
    };

    img.src = url;
  });
}

/**
 * Prepare an image file (JPEG, PNG, WebP, SVG) according to settings
 */
export async function prepareImagePayload(
  file: File,
  pngBackground: PngBackground,
  silhouetteMode: boolean
): Promise<PreparedInlineData> {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch (err) {
    // If SVG fails to load via standard blob URL, try reading text
    if (isSvg) {
      try {
        const text = await file.text();
        const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
        img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => rej(new Error('Failed to load SVG data URI'));
          i.src = dataUri;
        });
      } catch {
        throw new Error('Could not parse SVG visual artwork');
      }
    } else {
      throw err;
    }
  }

  let w = img.naturalWidth || img.width || 800;
  let h = img.naturalHeight || img.height || 600;
  if (w <= 0 || h <= 0) {
    w = 800;
    h = 600;
  }

  const maxDim = 1024;
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Silhouette mode for SVG or PNG
  if (silhouetteMode && (isSvg || isPng)) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(img, 0, 0, w, h);
      const imgData = tempCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // New canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      const targetData = ctx.getImageData(0, 0, w, h);
      const tdata = targetData.data;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 40) {
          tdata[i] = 0;
          tdata[i + 1] = 0;
          tdata[i + 2] = 0;
          tdata[i + 3] = 255;
        } else {
          tdata[i] = 255;
          tdata[i + 1] = 255;
          tdata[i + 2] = 255;
          tdata[i + 3] = 255;
        }
      }
      ctx.putImageData(targetData, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        mime_type: 'image/jpeg',
        data: dataUrl.split(',')[1] || '',
      };
    }
  }

  // Transparent PNG / SVG background handling
  if (isPng || isSvg) {
    if (pngBackground === 'White Background') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        mime_type: 'image/jpeg',
        data: dataUrl.split(',')[1] || '',
      };
    } else if (pngBackground === 'Black Background') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        mime_type: 'image/jpeg',
        data: dataUrl.split(',')[1] || '',
      };
    } else {
      // Transparent (Original)
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/png');
      return {
        mime_type: 'image/png',
        data: dataUrl.split(',')[1] || '',
      };
    }
  }

  // Standard JPEG / WebP
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    mime_type: 'image/jpeg',
    data: dataUrl.split(',')[1] || '',
  };
}
