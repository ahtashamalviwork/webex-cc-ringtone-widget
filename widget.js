(function () {
  const container = document.createElement('div');
  container.style.margin = '5px';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.gap = '4px';

  const label = document.createElement('label');
  label.textContent = '🔔 Ringtone Output:';
  label.style.fontSize = '12px';

  const select = document.createElement('select');
  select.style.fontSize = '12px';
  select.style.padding = '2px';

  const audio = document.createElement('audio');
  audio.src = 'https://ahtashamalviwork.github.io/webex-cc-ringtone-widget/ringtone.mp3';
  audio.loop = true;

  container.appendChild(label);
  container.appendChild(select);
  document.body.appendChild(container);

  let selectedDeviceId = null;

  async function loadAudioOutputs() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      select.innerHTML = '';

      devices
        .filter((d) => d.kind === 'audiooutput')
        .forEach((device) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Speaker (${device.deviceId})`;
          select.appendChild(option);
        });

      const saved = localStorage.getItem('ringDeviceId');
      if (saved) {
        select.value = saved;
        selectedDeviceId = saved;
      }
    } catch (e) {
      console.error('Failed to enumerate devices:', e);
    }
  }

  select.addEventListener('change', async () => {
    selectedDeviceId = select.value;
    localStorage.setItem('ringDeviceId', selectedDeviceId);
  });

  async function setOutputDevice() {
    if (typeof audio.setSinkId === 'function' && selectedDeviceId) {
      try {
        await audio.setSinkId(selectedDeviceId);
      } catch (err) {
        console.warn('setSinkId failed:', err);
      }
    }
  }

  async function playRingtone() {
    await setOutputDevice();
    try {
      await audio.play();
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }

  function stopRingtone() {
    audio.pause();
    audio.currentTime = 0;
  }

  function subscribeToEvents() {
    if (!window._dtcc || !window._dtcc.subscribe) {
      console.warn('Webex _dtcc SDK not found.');
      return;
    }

    window._dtcc.subscribe('TASK', async (task) => {
      const event = task?.event;
      console.log('[TASK event]', event);

      if (event === 'NEW') {
        await playRingtone();
      } else if (event === 'ACCEPTED' || event === 'ENDED') {
        stopRingtone();
      }
    });
  }

  loadAudioOutputs();
  subscribeToEvents();
})();
