# Icon Placeholders

Chrome extensions require PNG icons in specific sizes:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Current Status

An SVG source file (`icon.svg`) is provided as a reference design.

## To Generate PNG Icons

1. Use the `icon.svg` as source
2. Convert to PNG at the required sizes (16x16, 48x48, 128x128)
3. Tools:
   - [SVG to PNG converters](https://cloudconvert.com/svg-to-png)
   - Image editing tools (Figma, Photoshop, Sketch)
   - Command line: `rsvg-convert` or `inkscape`

## Temporary Development

For development, you may use any valid image format. Replace these placeholder files with actual PNG icons before publishing.