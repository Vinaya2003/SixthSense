# Vision Voice - Accessibility App for Visually Impaired

Vision Voice is a web application designed specifically for visually impaired users, featuring gesture-based controls, speech synthesis, and speech recognition to enable communication.

## Features

- **Accessible Login System**: For both admin and client users
- **Gesture-Based Navigation**:
  - Swipe Left/Right: Navigate between Vision and Hand Sign modes
  - Swipe Up/Down: Send and read messages
  - Hold: Activate SOS emergency mode
- **Voice Assistance**: Text-to-speech for all app interactions
- **Voice Input**: Speech-to-text for message composition
- **Screen Reader Compatibility**: Fully compatible with assistive technologies

## Demo Credentials

For testing purposes, use these login credentials:

- **Admin User**:
  - Username: `admin`
  - Password: `admin123`
- **Client User**:
  - Username: `user`
  - Password: `user123`

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge recommended)
- Internet connection (for initial loading)

### Installation

1. Clone the repository or download the files
2. Open the `index.html` file in your web browser

Alternatively, you can host the files on any web server.

## Usage

1. **Login Screen**:
   - Enter username and password
   - Select user type (Admin or Client)
   - Click Login or press Enter

2. **Main Screen**:
   - Use swipe gestures to navigate
   - Listen to voice prompts for guidance
   - Interact with the buttons if needed

3. **Messaging**:
   - Swipe up to compose a message
   - Use voice input or type your message
   - Swipe down to have messages read aloud

4. **SOS Emergency**:
   - Hold for 1 second to activate SOS mode
   - This will notify emergency contacts (demo only)

## Accessibility Features

- **Voice Guidance**: All screens and elements have voice announcements
- **High Contrast UI**: Clear visual elements with proper contrast ratios
- **Gesture Controls**: Large detection areas for easier navigation
- **Screen Reader Optimization**: Proper ARIA attributes for screen reader compatibility

## Browser Support

- Chrome: Full support
- Firefox: Full support
- Edge: Full support
- Safari: Partial support (Speech recognition may have limitations)

## License

This project is licensed under the MIT License.

## Acknowledgments

- Icons provided by various open-source icon libraries
- Speech recognition powered by Web Speech API 