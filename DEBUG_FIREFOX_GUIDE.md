# Firefox Debugging Guide for Cursor

## Prerequisites

1. **Firefox Extension**: Install the "Firefox Debug" extension in Cursor
2. **Firefox Browser**: Ensure Firefox is installed on your system
3. **Development Server**: The Vite development server will be started automatically

## Quick Start

### Method 1: Using Cursor's Debug Panel

1. Open Cursor
2. Go to the Debug panel (Ctrl+Shift+D)
3. Select one of these configurations:
   - **"Launch Firefox - Development Server"** - For development debugging
   - **"Launch Firefox - Production Build"** - For production debugging
   - **"Attach to Firefox"** - To attach to an already running Firefox instance
4. Click the play button or press F5

### Method 2: Using Scripts

#### Windows Batch:
```bash
scripts/debug-firefox.bat
```

#### PowerShell:
```powershell
scripts/debug-firefox.ps1
```

## Configuration Details

### Development Server Configuration
- **URL**: http://localhost:5173
- **Source Maps**: Enabled
- **Hot Reload**: Enabled
- **Debugger Port**: 6000

### Path Mappings
- `http://localhost:5173/src` → `client/src`
- `http://localhost:5173` → `client`

## Debugging Features

### Breakpoints
- Set breakpoints directly in your TypeScript/React files
- Breakpoints work in both development and production builds
- Source maps ensure you see original code, not compiled code

### Debug Console
- Access browser console directly in Cursor
- Execute JavaScript commands
- Inspect variables and call stack

### Variable Inspection
- Hover over variables to see their values
- Use the Variables panel for detailed inspection
- Watch expressions for real-time monitoring

### Call Stack
- Navigate through function calls
- Jump to different stack frames
- See the execution path

## Troubleshooting

### Common Issues

1. **Firefox not launching**:
   - Check if Firefox is installed in standard locations
   - Update the path in `.vscode/launch.json` if needed

2. **Source maps not working**:
   - Ensure `sourcemap: true` in `vite.config.ts`
   - Check path mappings in launch configuration

3. **Breakpoints not hitting**:
   - Verify the file is being served correctly
   - Check if source maps are generated
   - Ensure the file path matches exactly

4. **Port conflicts**:
   - Change the debugger port in launch configuration
   - Kill any existing Firefox processes

### Debug Commands

```bash
# Start development server manually
cd client
npm run dev

# Check if ports are in use
netstat -an | findstr :5173
netstat -an | findstr :6000

# Kill Firefox processes
taskkill /f /im firefox.exe
```

## Advanced Configuration

### Custom Firefox Executable
Update `.vscode/launch.json`:
```json
{
  "firefoxExecutable": "C:\\Path\\To\\Your\\Firefox.exe"
}
```

### Additional Firefox Arguments
```json
{
  "firefoxArgs": [
    "-devtools",
    "-start-debugger-server",
    "6000",
    "-new-instance"
  ]
}
```

### Environment Variables
Set in `.vscode/launch.json`:
```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "true"
  }
}
```

## Tips

1. **Use Console.log**: Add `console.log()` statements for quick debugging
2. **React DevTools**: Install React DevTools extension in Firefox
3. **Network Tab**: Use Firefox's Network tab to debug API calls
4. **Performance**: Use Firefox's Performance tab for optimization

## File Structure

```
.vscode/
├── launch.json          # Debug configurations
└── settings.json        # Editor settings

scripts/
├── debug-firefox.bat    # Windows batch script
└── debug-firefox.ps1    # PowerShell script

client/
├── vite.config.ts       # Vite configuration
└── src/                 # Source code
```

## Support

If you encounter issues:
1. Check the Debug Console in Cursor for error messages
2. Verify all prerequisites are installed
3. Check the Firefox extension is enabled
4. Restart Cursor and try again
