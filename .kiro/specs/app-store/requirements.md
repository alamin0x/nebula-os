# Requirements Document

## Introduction

The App Store feature adds an installable application ecosystem to Nebula OS. Users can browse a pre-built catalog of apps, install or uninstall them, and import custom apps via JSON manifests or `.nebula` files. Installed apps integrate seamlessly with the existing window system — appearing in the Dock and as Desktop Icons, opening as draggable/resizable windows, and rendering content via sandboxed iframes. The system supports two app types: "web" (loads a URL) and "html" (runs inline HTML/CSS/JS). All installed app state persists in localStorage across page refreshes.

## Glossary

- **App_Store**: The built-in application window that displays the catalog of installable apps and provides install/uninstall controls
- **App_Manifest**: A JSON object that defines a store app's metadata, type, and content
- **Store_App**: An application defined by an App_Manifest that can be installed and run within Nebula OS
- **Built_In_App**: An existing Nebula OS application (Notes, Browser, Terminal, etc.) that is always available and not managed by the App Store
- **App_Catalog**: The collection of pre-built Store_Apps available for browsing and installation in the App_Store
- **Installed_Apps_Store**: The Zustand store that manages the state of installed Store_Apps and persists to localStorage
- **App_Renderer_Iframe**: A sandboxed iframe element used to render Store_App content within a window
- **Nebula_File**: A file with the `.nebula` extension containing a valid App_Manifest in JSON format

## Requirements

### Requirement 1: App Store Window

**User Story:** As a Nebula OS user, I want to open an App Store from the Dock, so that I can browse and manage installable applications.

#### Acceptance Criteria

1. THE App_Store SHALL be accessible as an entry in the Dock and Desktop Icons
2. WHEN the user opens the App_Store, THE App_Store SHALL display the App_Catalog as a grid of app cards showing each app's name, icon, and description
3. WHEN a Store_App is not installed, THE App_Store SHALL display an "Install" button on the app card
4. WHEN a Store_App is already installed, THE App_Store SHALL display an "Uninstall" button on the app card
5. THE App_Store SHALL open as a window managed by the existing WindowManager with drag, resize, minimize, maximize, and close functionality

### Requirement 2: App Manifest Format

**User Story:** As a developer, I want a structured JSON manifest format for defining apps, so that apps can be consistently described and validated.

#### Acceptance Criteria

1. THE App_Manifest SHALL contain the following required fields: id (unique string identifier), name (display name), icon (emoji string), description (short text), and type ("web" or "html")
2. WHEN the type field is "web", THE App_Manifest SHALL contain a url field specifying the URL to load in an iframe
3. WHEN the type field is "html", THE App_Manifest SHALL contain a html field containing inline HTML/CSS/JS code to render in a sandboxed iframe
4. THE App_Manifest SHALL use a unique id field that does not collide with existing Built_In_App identifiers
5. IF an App_Manifest is missing required fields or contains an invalid type value, THEN THE Installed_Apps_Store SHALL reject the manifest and display a validation error message to the user

### Requirement 3: App Installation

**User Story:** As a user, I want to install apps from the store catalog, so that they become available on my desktop for quick access.

#### Acceptance Criteria

1. WHEN the user clicks "Install" on a Store_App card, THE Installed_Apps_Store SHALL add the app to the installed apps collection
2. WHEN a Store_App is installed, THE Dock SHALL display the app's icon as a launchable entry
3. WHEN a Store_App is installed, THE DesktopIcons SHALL display the app's icon as a double-clickable entry
4. WHEN the user clicks "Uninstall" on an installed Store_App, THE Installed_Apps_Store SHALL remove the app from the installed apps collection
5. WHEN a Store_App is uninstalled, THE Dock SHALL remove the app's icon entry
6. WHEN a Store_App is uninstalled, THE DesktopIcons SHALL remove the app's icon entry
7. IF a Store_App is uninstalled while its window is open, THEN THE WindowManager SHALL close the app's window

### Requirement 4: Persistence

**User Story:** As a user, I want my installed apps to persist across page refreshes, so that I do not lose my app setup.

#### Acceptance Criteria

1. WHEN a Store_App is installed or uninstalled, THE Installed_Apps_Store SHALL persist the current installed apps collection to localStorage
2. WHEN Nebula OS loads, THE Installed_Apps_Store SHALL restore the installed apps collection from localStorage
3. IF localStorage contains corrupted or invalid data, THEN THE Installed_Apps_Store SHALL fall back to an empty installed apps collection and log a warning to the console

### Requirement 5: Custom App Import

**User Story:** As a power user, I want to import custom apps by pasting JSON or uploading a .nebula file, so that I can run my own apps in Nebula OS.

#### Acceptance Criteria

1. THE App_Store SHALL provide a "Custom Import" section with a text area for pasting JSON manifests
2. THE App_Store SHALL provide a file upload control that accepts files with the `.nebula` extension
3. WHEN the user submits a valid JSON manifest via the text area, THE Installed_Apps_Store SHALL install the custom app
4. WHEN the user uploads a valid Nebula_File, THE Installed_Apps_Store SHALL parse the file content as JSON and install the custom app
5. IF the pasted JSON or uploaded file content is not valid JSON, THEN THE App_Store SHALL display a parse error message to the user
6. IF the parsed JSON does not conform to the App_Manifest format, THEN THE App_Store SHALL display a validation error message listing the missing or invalid fields
7. WHEN a custom app is successfully imported, THE App_Store SHALL display a success confirmation and the app SHALL appear in the installed apps list

### Requirement 6: Pre-built Store Catalog

**User Story:** As a user, I want a selection of ready-made apps in the store, so that I have useful apps to install immediately.

#### Acceptance Criteria

1. THE App_Catalog SHALL contain at least 6 pre-built Store_Apps
2. THE App_Catalog SHALL include apps of both "web" and "html" types
3. THE App_Catalog SHALL include the following apps: Calculator, Clock, Weather Widget, Paint App, Snake Game, and Pomodoro Timer
4. Each pre-built Store_App in the App_Catalog SHALL have a unique id, descriptive name, emoji icon, and short description
5. Each "html" type app in the App_Catalog SHALL contain fully functional inline HTML/CSS/JS code that runs without external dependencies

### Requirement 7: Dynamic App Rendering

**User Story:** As a user, I want installed store apps to open as windows like built-in apps, so that the experience is consistent across all applications.

#### Acceptance Criteria

1. WHEN the user launches an installed Store_App from the Dock or DesktopIcons, THE WindowManager SHALL open a new window for the app
2. THE App_Renderer_Iframe SHALL render "web" type apps by setting the iframe src attribute to the manifest's url field
3. THE App_Renderer_Iframe SHALL render "html" type apps by writing the manifest's html content into the iframe using srcdoc
4. THE App_Renderer_Iframe SHALL apply the sandbox attribute with "allow-scripts" permission to isolate app content from the host page
5. WHEN a "web" type app's iframe fails to load, THE App_Renderer_Iframe SHALL display a fallback error message within the window
6. THE App_Renderer_Iframe SHALL fill the entire window content area below the title bar
7. THE WindowManager SHALL assign the app's manifest name as the window title

### Requirement 8: Manifest Serialization Round-Trip

**User Story:** As a developer, I want to ensure that app manifests can be serialized and deserialized without data loss, so that persistence and import/export are reliable.

#### Acceptance Criteria

1. FOR ALL valid App_Manifests, serializing to JSON and parsing back SHALL produce an equivalent App_Manifest object (round-trip property)
2. FOR ALL installed apps collections, persisting to localStorage and restoring SHALL produce an equivalent collection (round-trip property)
