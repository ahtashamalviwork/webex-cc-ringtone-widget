(function () {
  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.padding = '4px 6px';
  container.style.fontSize = '12px';

  const label = document.createElement('label');
  label.textContent = '🎧 Secondary Ringtone Output:';

  const select = document.createElement('select');
  select.style.fontSize = '12px';
  select.style.padding = '2px';

  const testButton = document.createElement('button');
  testButton.textContent = '🔈 Test Ringtone';
  testButton.style.fontSize = '12px';
  testButton.style.padding = '2px 6px';
  testButton.style.cursor = 'pointer';

  const audio = document.createElement('audio');
  audio.src = 'https://desktop.wxcc-us1.cisco.com/sounds/ringtone.mp3';
  audio.loop = true;

  let selectedDeviceId = null;

  async function loadAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      select.innerHTML = '';

      outputs.forEach((device) => {
        const opt = document.createElement('option');
        opt.value = device.deviceId;
        opt.text = device.label || `Output (${device.deviceId})`;
        select.appendChild(opt);
      });

      const savedId = localStorage.getItem('ringDeviceId');
      if (savedId && outputs.find(d => d.deviceId === savedId)) {
        select.value = savedId;
        selectedDeviceId = savedId;
      } else if (outputs.length > 0) {
        selectedDeviceId = outputs[0].deviceId;
        select.value = selectedDeviceId;
      }
    } catch (err) {
      console.error('[Ringtone Widget] Failed to load outputs:', err);
    }
  }

  select.addEventListener('change', () => {
    selectedDeviceId = select.value;
    localStorage.setItem('ringDeviceId', selectedDeviceId);
  });

  async function setAudioOutput() {
    if (typeof audio.setSinkId === 'function' && selectedDeviceId) {
      try {
        await audio.setSinkId(selectedDeviceId);
      } catch (err) {
        console.warn('[Ringtone Widget] setSinkId error:', err);
      }
    }
  }

  async function playRingtone() {
    await setAudioOutput();
    try {
      await audio.play();
    } catch (err) {
      console.warn('[Ringtone Widget] audio.play error:', err);
    }
  }

  function stopRingtone() {
    audio.pause();
    audio.currentTime = 0;
  }

  function bindWebexEvents() {
    if (!window._dtcc || !window._dtcc.subscribe) {
      console.warn('[Ringtone Widget] _dtcc not available yet.');
      return;
    }

    window._dtcc.subscribe('TASK', async (task) => {
      const event = task?.event;
      console.log('[Ringtone Widget] TASK event:', event);

      if (event === 'NEW') {
        await playRingtone();
      } else if (event === 'ACCEPTED' || event === 'ENDED') {
        stopRingtone();
      }
    });
  }

  testButton.addEventListener('click', async () => {
    await playRingtone();
    setTimeout(stopRingtone, 10000); // Play for 4 seconds
  });

  container.appendChild(label);
  container.appendChild(select);
  container.appendChild(testButton);
  document.body.appendChild(container);

  loadAudioDevices();
  bindWebexEvents();
})();
