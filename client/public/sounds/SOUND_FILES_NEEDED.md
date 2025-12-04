# Sound Files Required

## Current Files
- ✅ `app-background.mp3` - Background music for menus/dashboard
- ✅ `game-background.mp3` - Background music during gameplay
- ✅ `button-click.mp3` - General button click sound
- ✅ `winner.mp3` - Winner celebration sound

## New Files Needed

### Game Actions
1. **`loser.mp3`** - Sound when player loses a round
   - Suggested: Disappointed/sympathetic sound effect
   - Duration: ~2-3 seconds

2. **`card-distribute.mp3`** - Sound when cards are being dealt
   - Suggested: Card shuffling/dealing sound
   - Duration: ~1-2 seconds

3. **`chaal.mp3`** - Sound for "Chaal" (seen bet)
   - Suggested: Confident betting sound
   - Duration: ~1 second

4. **`blind.mp3`** - Sound for "Blind" bet
   - Suggested: Quick, subtle betting sound
   - Duration: ~0.5-1 second

5. **`fold.mp3`** - Sound when player folds/packs
   - Suggested: Cards being discarded sound
   - Duration: ~1 second

6. **`raise.mp3`** - Sound when player raises the bet
   - Suggested: Bold, assertive sound
   - Duration: ~1-1.5 seconds

7. **`coins.mp3`** - Sound for coin/token transactions
   - Suggested: Coins clinking/dropping sound
   - Duration: ~1-2 seconds

## Sound Requirements
- Format: MP3
- Sample Rate: 44.1kHz or 48kHz
- Bitrate: 128-192 kbps
- Volume: Normalized to -3dB to -6dB peak

## Usage in Game

### When each sound plays:
- **app-background.mp3**: Loops in menus, dashboard, profile pages
- **game-background.mp3**: Loops during active gameplay
- **button-click.mp3**: All UI button clicks
- **card-distribute.mp3**: When new round starts and cards are dealt
- **chaal.mp3**: When player makes a "seen" bet (not blind)
- **blind.mp3**: When player makes a blind bet
- **fold.mp3**: When player folds/packs
- **raise.mp3**: When player raises above minimum bet
- **winner.mp3**: When player wins the round
- **loser.mp3**: When player loses the round
- **coins.mp3**: During token transfers and transactions

## Implementation Status
✅ Web - SoundManager updated with all methods
🔄 Mobile - Needs implementation
🔄 Sound files - Need to be created/sourced

## Notes
- All sounds should be clear but not overwhelming
- Volumes are pre-configured in SoundManager (0.5-0.7)
- Sounds respect user's sound effects toggle
- Background music respects user's music toggle
