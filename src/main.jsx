import {createRoot} from 'react-dom/client';import App from './App.jsx';import './styles.css';
createRoot(document.getElementById('root')).render(<App/>);
// Colour status badges by their text (purely visual)
let t;const paint=()=>document.querySelectorAll('.badge').forEach(el=>{if(el.dataset.tone&&el.dataset.fixed)return;const s=el.textContent.toLowerCase();
 el.dataset.tone=/reject|cancel|suspend|hidden|closed|dismiss|low/.test(s)?'bad':/approved|active|deliver|resolved|complet|registered|open|visible|confirm|hired|assigned|scheduled/.test(s)?'ok':/pend|submit|review|wait|progress|placed|process|ship|new|additional|shortlist/.test(s)?'warn':''});
new MutationObserver(()=>{cancelAnimationFrame(t);t=requestAnimationFrame(paint)}).observe(document.body,{childList:true,subtree:true,characterData:true});
