import { useEffect } from 'react';

export function useToast() {
  let timer;
  function show(message) {
    const el = document.getElementById('toast-host');
    if (!el) return;
    el.innerHTML = `<div class="toast">${message}</div>`;
    clearTimeout(timer);
    timer = setTimeout(() => { el.innerHTML = ''; }, 2200);
  }
  return show;
}

export function ToastHost() {
  useEffect(() => { return () => {}; }, []);
  return <div id="toast-host" />;
}
