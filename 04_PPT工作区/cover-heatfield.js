(function (root) {
  'use strict';
  const palette = [[5, 40, 31], [11, 93, 59], [56, 135, 96], [204, 177, 111], [242, 157, 103]];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const v = clamp(value); return v * v * (3 - 2 * v); };
  const lobes = [
    [.88, .20, .17, .24, .93, .2],
    [.76, .39, .13, .17, .73, 1.8],
    [.97, .54, .20, .16, .69, 3.2],
    [.77, .83, .24, .12, .91, 4.6],
    [.49, 1.01, .25, .14, .59, 6.1],
    [.44, -.16, .23, .18, .48, 2.5]
  ];

  // One summed density field, not separately composited glowing circles.
  function density(x, y, time) {
    const t = time * .15;
    const u = x + .052 * Math.sin(y * 10.8 + t * .71) + .019 * Math.cos(y * 23 - t * .4);
    const v = y + .045 * Math.sin(x * 9.3 - t * .6) + .025 * Math.cos(x * 19 + t * .5);
    let sum = 0;
    for (const [cx, cy, sx, sy, weight, phase] of lobes) {
      const dx = (u - cx - Math.sin(t * .63 + phase) * .06) / sx;
      const dy = (v - cy - Math.cos(t * .57 + phase) * .055) / sy;
      sum += Math.exp(-(dx * dx + dy * dy) * 1.6) * weight * (.84 + .16 * Math.sin(t + phase));
    }
    const titleMask = .18 + .82 * smooth((x - .33) / .48);
    return clamp((1 - Math.exp(-sum * 1.65)) * titleMask);
  }

  function color(value) {
    const scaled = clamp(value) * (palette.length - 1);
    const index = Math.min(palette.length - 2, Math.floor(scaled));
    const mix = smooth(scaled - index);
    return palette[index].map((v, c) => Math.round(v + (palette[index + 1][c] - v) * mix));
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {density, color, palette};
  if (!root.document) return;
  const canvas = document.querySelector('[data-heatfield]');
  if (!canvas) return;
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) return;
  const slide = canvas.closest('.slide');
  canvas.width = 400;
  canvas.height = 300;
  const frame = context.createImageData(canvas.width, canvas.height);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = 0, previous = null, request = 0, paused = false;

  function render(time) {
    const {width, height} = canvas;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rgb = color(density(x / width, y / height, time));
        const i = (y * width + x) * 4;
        frame.data[i] = rgb[0]; frame.data[i + 1] = rgb[1]; frame.data[i + 2] = rgb[2]; frame.data[i + 3] = 255;
      }
    }
    context.putImageData(frame, 0, 0);
    if (time === 0) document.querySelectorAll('#overview [data-heatfield]').forEach(copy => {
      copy.width = canvas.width; copy.height = canvas.height;
      copy.getContext('2d').drawImage(canvas, 0, 0);
    });
  }

  function tick(now) {
    request = 0;
    if (!active()) { previous = null; return; }
    if (previous === null) previous = now;
    if (now - previous >= 50) {
      elapsed += Math.min(now - previous, 100) / 1000;
      previous = now;
      render(elapsed);
    }
    request = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(request);
    previous = null;
    if (active()) request = requestAnimationFrame(tick);
  }
  function active() {
    return !document.hidden && !reduced.matches && !paused && (!slide || (slide.classList.contains('is-current') && !document.body.classList.contains('low-power')));
  }
  render(0);
  resume();
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', resume);
  if (slide) {
    new MutationObserver(resume).observe(slide, {attributes:true, attributeFilter:['class']});
    new MutationObserver(resume).observe(document.body, {attributes:true, attributeFilter:['class']});
  }
  document.addEventListener('keydown', event => {
    if (slide) return;
    if (event.code !== 'Space' || event.target.closest('button, input, a, textarea')) return;
    event.preventDefault(); paused = !paused; resume();
  });
})(typeof window === 'undefined' ? globalThis : window);
