(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const about = document.querySelector('#about');
  const clinic = document.querySelector('#clinic');
  const values = document.querySelector('#values');
  const vision = document.querySelector('#vision');
  const aboutStage = about.querySelector('.about-stage');
  const valueStage = values.querySelector('.values-sticky');
  const visionStage = vision.querySelector('.vision-stage');
  const aboutParagraphs = [...about.querySelectorAll('.about-paragraph')];
  const visionLines = [...vision.querySelectorAll('.vision-line')];
  const visionIntro = vision.querySelector('.vision-intro');
  const visionSign = vision.querySelector('.vision-sign');

  // Split characters without changing the accessible, complete heading text.
  const visionCharacters = [];
  visionLines.forEach(line => {
    const fragment = document.createDocumentFragment();
    for (const char of Array.from(line.textContent)) {
      if (/\s/.test(char)) { fragment.append(document.createTextNode(char)); continue; }
      const span = document.createElement('span');
      span.className = 'vision-char';
      span.textContent = char;
      fragment.append(span);
      visionCharacters.push({ element: span, emphasized: line.tagName === 'EM' });
    }
    line.replaceChildren(fragment);
  });

  const desktopCurve = clinic.querySelector('.clinic-curve-desktop path');
  const mobileCurves = [...clinic.querySelectorAll('.clinic-curve-mobile path')];
  const curveLengths = new Map();
  [desktopCurve, ...mobileCurves].forEach(path => {
    const length = path.getTotalLength();
    curveLengths.set(path, length);
    path.style.strokeDasharray = String(length);
  });

  const clamp = value => Math.min(1, Math.max(0, value));
  const phase = (value, start, end) => clamp((value - start) / (end - start));
  const easeInOut = value => value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  const state = { about: 0, clinic: 0, mobileCurve0: 0, mobileCurve1: 0, values: 0, vision: 0 };
  const target = { ...state };
  const mobileCurveFinished = [false, false];
  let needsMeasure = true;
  let frame = 0;
  let lastFrame = 0;

  function pinnedProgress(section, stage) {
    return clamp(-section.getBoundingClientRect().top / Math.max(1, section.offsetHeight - stage.offsetHeight));
  }

  function measure() {
    const vh = window.innerHeight;
    const width = window.innerWidth;
    target.about = width > 768 ? pinnedProgress(about, aboutStage) : 0;
    if (width <= 768 && about.getBoundingClientRect().top < vh * .65) about.classList.add('is-about-visible');
    target.values = width > 1024 ? pinnedProgress(values, valueStage) : 0;
    target.vision = pinnedProgress(vision, visionStage);

    const clinicRect = clinic.getBoundingClientRect();
    target.clinic = clamp((vh * .75 - clinicRect.top) / Math.max(1, clinicRect.height - vh * .1));
    const reverseRect = clinic.querySelector('.clinic-row.reverse').getBoundingClientRect();
    const mobileProgress = [
      clamp((vh * .85 - clinicRect.top) / (vh * .75)),
      clamp((vh * .85 - reverseRect.top) / (reverseRect.height + vh * .35))
    ];
    mobileProgress.forEach((progress, index) => {
      if (width <= 768 && progress === 1) mobileCurveFinished[index] = true;
      target[`mobileCurve${index}`] = mobileCurveFinished[index] ? 1 : progress;
    });
    needsMeasure = false;
  }

  function drawCurve(path, progress) {
    path.style.strokeDashoffset = String(curveLengths.get(path) * (1 - progress));
  }

  function renderAbout(progress) {
    const time = progress * 9;
    const move = easeInOut(phase(time, 3, 6));
    about.style.setProperty('--about-shift', `${window.innerWidth * .28 * move}px`);
    about.style.setProperty('--about-symbol-opacity', String(time < 3 ? .16 + .09 * phase(time, 0, 3) : .25 + .75 * move));
    about.style.setProperty('--about-text-opacity', String(phase(time, 4.5, 6)));
    aboutParagraphs.forEach((paragraph, index) => {
      const visible = phase(time, 5 + index, 8 + index);
      paragraph.style.setProperty('--paragraph-opacity', String(visible));
      paragraph.style.setProperty('--paragraph-y', `${40 * (1 - visible)}px`);
    });
  }

  function renderValues(progress) {
    const reveal = phase(progress * 2.3, .3, 1.3);
    values.style.setProperty('--value-close', `${50 * reveal}%`);
    values.style.setProperty('--value-open', `${50 * (1 - reveal)}%`);
  }

  function revealGroup(element, progress) {
    element.style.setProperty('--line-opacity', String(progress));
    element.style.setProperty('--line-y', `${40 * (1 - progress)}px`);
  }

  function renderVision(progress) {
    // A short entrance, staggered character filling, and a readable final hold.
    const duration = 2.5 + (visionCharacters.length - 1) * .3 + 1.5;
    const time = progress * duration;
    revealGroup(visionIntro, phase(time, .5, 2));
    visionLines.forEach((line, index) => revealGroup(line, phase(time, .5 + index * .3, 2 + index * .3)));
    revealGroup(visionSign, phase(time, 1.1, 2.6));
    visionCharacters.forEach(({ element, emphasized }, index) => {
      const fill = phase(time, 2.5 + index * .3, 3 + index * .3);
      const color = emphasized ? [200, 238, 231] : [255, 255, 255];
      const rgb = color.map(channel => Math.round(255 + (channel - 255) * fill));
      element.style.color = `rgba(${rgb.join(',')},${.3 + .7 * fill})`;
    });
  }

  function render() {
    renderAbout(state.about);
    drawCurve(desktopCurve, state.clinic);
    mobileCurves.forEach((path, index) => drawCurve(path, state[`mobileCurve${index}`]));
    renderValues(state.values);
    renderVision(state.vision);
  }

  function tick(now) {
    frame = 0;
    if (motionPreference.matches) return;
    if (needsMeasure) measure();
    const dt = Math.min(64, lastFrame ? now - lastFrame : 16);
    lastFrame = now;
    let unsettled = false;
    for (const key of Object.keys(state)) {
      const difference = target[key] - state[key];
      // Exponential settling keeps scroll reversal smooth without running at rest.
      const smoothing = key === 'about' ? 160 : 100;
      state[key] += difference * (1 - Math.exp(-dt / smoothing));
      if (Math.abs(difference) < .0001) state[key] = target[key];
      else unsettled = true;
    }
    render();
    if (unsettled) frame = requestAnimationFrame(tick);
    else lastFrame = 0;
  }

  function requestUpdate() {
    needsMeasure = true;
    if (!frame && !motionPreference.matches) frame = requestAnimationFrame(tick);
  }

  function configureMotion() {
    const enabled = !motionPreference.matches;
    document.documentElement.classList.toggle('scroll-motion-ready', enabled);
    if (!enabled) {
      cancelAnimationFrame(frame); frame = 0;
      [desktopCurve, ...mobileCurves].forEach(path => drawCurve(path, 1));
      visionCharacters.forEach(({ element }) => element.style.removeProperty('color'));
    } else {
      measure();
      Object.assign(state, target);
      render();
      requestUpdate();
    }
  }

window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('pageshow', requestUpdate);
  window.addEventListener('load', requestUpdate, { once: true });
  motionPreference.addEventListener('change', configureMotion);
  document.fonts.ready.then(requestUpdate);
  configureMotion();
})();
