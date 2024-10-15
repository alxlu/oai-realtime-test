const micButton = document.getElementById('mic-button');

micButton.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.start(250); // Capture in chunks of 250ms

      console.log(window.electronAPI);
      mediaRecorder.ondataavailable = (event) => {
        // console.log(event);
        event.data.arrayBuffer().then(buffer => {
          window.electronAPI.sendAudioData(buffer);
        });
      };

      micButton.textContent = '🎤 Listening...';

      mediaRecorder.onstop = () => {
        micButton.textContent = '🎤 Start Listening';
      };

      micButton.onclick = () => {
        mediaRecorder.stop();
      };
    })
    .catch(err => {
      console.error('Error accessing microphone:', err);
    });
});