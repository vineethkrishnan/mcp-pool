import {useEffect} from 'react';
import type {ReactNode} from 'react';
import AskAI from '@site/src/components/AskAI';

export default function Root({children}: {children: ReactNode}): ReactNode {
  // Inject "Ask AI" button into the navbar
  useEffect(() => {
    const injectButton = () => {
      const navRight = document.querySelector('.navbar__items--right');
      if (!navRight || navRight.querySelector('[data-ask-ai]')) return;

      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-ask-ai', 'true');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginRight = '0.5rem';

      const button = document.createElement('button');
      button.className = 'ask-ai-navbar-btn';
      button.innerHTML = '<span style="font-size:0.95rem">&#10024;</span> Ask AI';
      button.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-ask-ai'));
      });

      wrapper.appendChild(button);
      navRight.insertBefore(wrapper, navRight.firstChild);
    };

    // Inject after navbar renders, and re-inject on DOM changes (route transitions)
    const timer = setTimeout(injectButton, 100);
    const observer = new MutationObserver(() => {
      const navRight = document.querySelector('.navbar__items--right');
      if (navRight && !navRight.querySelector('[data-ask-ai]')) {
        injectButton();
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        .ask-ai-navbar-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          color: var(--ifm-color-primary);
          font-size: 0.85rem;
          font-weight: 600;
          font-family: var(--ifm-font-family-base);
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          white-space: nowrap;
        }
        .ask-ai-navbar-btn:hover {
          background-color: rgba(79, 70, 229, 0.06);
          border-color: var(--ifm-color-primary-lighter);
        }
        [data-theme='dark'] .ask-ai-navbar-btn {
          border-color: rgba(255, 255, 255, 0.12);
          color: var(--ifm-color-primary-light);
        }
        [data-theme='dark'] .ask-ai-navbar-btn:hover {
          background-color: rgba(129, 140, 248, 0.1);
          border-color: var(--ifm-color-primary);
        }
      `}</style>
      {children}
      <AskAI />
    </>
  );
}
