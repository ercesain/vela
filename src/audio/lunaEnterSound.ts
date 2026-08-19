/**
 * Luna's "DÜNYASINA GİR" sonic signature — placeholder.
 *
 * No audio-playback library (e.g. `expo-av`, `expo-audio`) is installed in
 * this project, and none is added here — per project rules, new
 * dependencies need explicit permission first. This hook is the single
 * integration point for later: once a) the asset below exists locally and
 * b) an approved playback library is installed, fill in the body of
 * `play()` — nothing in `OracleWorldTransition` needs to change, it
 * already calls `play()` at the correct moment (the instant the takeover
 * starts, in sync with the haptic).
 *
 * EXPECTED LOCAL ASSET — create this file, then wire it in below:
 *   assets/audio/luna-enter.mp3   (or .m4a / .wav — whatever the chosen
 *                                  playback library supports)
 *
 * Suggested sonic signature (~0.8–1.2s total, matches the visual timing):
 *   0–200ms    very soft, low-frequency cinematic sub swell ("whoom")
 *   200–700ms  subtle reversed-bell / airy shimmer, rising
 *   ~500–650ms one clean crystal/chime accent (lines up with the
 *              third-eye glow pulse)
 *   700–1100ms dissolves into a very quiet celestial ambient tail
 * Should read as: portal / mystery / entering another realm.
 * Avoid: horror drones, jump-scares, aggressive bass drops, witch-cliché
 * stingers, loud music, long intros.
 *
 * Example future implementation with `expo-audio` (once installed):
 *
 *   import { createAudioPlayer } from 'expo-audio';
 *   const player = createAudioPlayer(require('../../assets/audio/luna-enter.mp3'));
 *   const play = () => { player.seekTo(0); player.play(); };
 */
export function useLunaEnterSound() {
  const play = () => {
    // Intentionally a no-op: does not `require()` the asset path above —
    // that file doesn't exist on disk yet, and requiring a missing local
    // asset breaks the Metro bundle even if this branch never runs.
  };

  return { play };
}
