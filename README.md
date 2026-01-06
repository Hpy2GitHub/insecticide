# insecticide - like pesticide for debugging CSS

Installation Instructions
    Create all the files in the directory structure shown above
    Create or download icons and place them in the icons/ folder
    Open Firefox and navigate to about:debugging
    Click "This Firefox" in the left sidebar
    Click "Load Temporary Add-on"
    Select any file from your extension folder (e.g., manifest.json)

How to Use
    Click the extension icon in the toolbar to toggle borders on/off
    When borders are active, hold Ctrl (or Cmd on Mac) and hover over any element
    A panel at the bottom will show information about the hovered element
    Different element types have different colored borders as per the mapping

Additional Notes
    The extension uses a comprehensive color mapping for different HTML elements
    The hover panel shows: element tag, ID, classes, dimensions, and position
    All borders are 1px solid lines with colors based on element type
    The extension state persists between page reloads
    Pressing Ctrl (or Cmd) reveals element details when hovering

You can customize the color mapping in the elementColors object in content.js to add more element types or change colors as needed.
