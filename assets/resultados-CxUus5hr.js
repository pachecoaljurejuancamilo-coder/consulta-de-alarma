import{a as e,f as t,i as n,l as r,n as i,o as a,p as o,s,u as c}from"./api-fGU-uJbN.js";var l=`<svg viewBox="0 0 64 96" aria-hidden="true" class="cinta-svg">
  <path d="M32 6 C14 6 12 30 24 46 L6 86 L18 90 L32 58 L46 90 L58 86 L40 46 C52 30 50 6 32 6 Z M32 18 C40 18 41 30 32 40 C23 30 24 18 32 18 Z" fill="#F2C42C" stroke="#B8901A" stroke-width="2" stroke-linejoin="round"/>
</svg>`,u=(e,t=document)=>t.querySelector(e),d=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),f=e=>e==null?`–`:`${e.toLocaleString(`es-CO`,{maximumFractionDigits:1,minimumFractionDigits:1})} %`,p=e=>e==null?`–`:e.toLocaleString(`es-CO`,{maximumFractionDigits:1,minimumFractionDigits:1}),m=new URLSearchParams(location.search).has(`demo`),h=t.flatMap(e=>e.orbes.filter(e=>e.tipo===`alarma`).map(e=>({id:e.id,texto:e.texto,estudio:e.estudio??null}))),g={op_entendiste:[`😵`,`😕`,`😐`,`🙂`,`🤩`],op_innovador:[`😴`,`🤔`,`👍`,`💡`,`🚀`]},_=[{valor:`Sí`,emoji:`✅`,clase:`si`},{valor:`Tal vez`,emoji:`🤷`,clase:`talvez`},{valor:`No`,emoji:`❌`,clase:`no`}];u(`#tablero`).innerHTML=`
  <header class="tb-cab">
    <div class="tb-marca">${l}<div><h1>Código Alarma 3D</h1><p>Resultados en vivo del taller</p></div></div>
    <div class="tb-estado"><span class="tb-vivo" aria-hidden="true"></span><span id="tb-actualizado">Conectando…</span></div>
    <div class="tb-participantes"><span id="tb-n" data-testid="participantes">0</span><small>participantes</small></div>
  </header>
  <p class="tb-aviso" id="tb-aviso" hidden></p>
  <main class="tb-grid">
    <section class="tb-panel tb-ranking">
      <h2><span aria-hidden="true">🏆</span> Ranking</h2>
      <ol id="tb-ranking" class="tb-lista"></ol>
      <h3>Avatares elegidos</h3>
      <div id="tb-avatares" class="tb-barras tb-barras-sm"></div>
    </section>
    <section class="tb-panel tb-signos">
      <h2><span aria-hidden="true">⚠</span> ¿Reconocieron los signos de alarma?</h2>
      <div class="tb-leyenda"><span><i class="ley-barra"></i> Taller de hoy</span><span><i class="ley-marca"></i> Nuestro estudio (${d(a.cita)})</span></div>
      <div id="tb-signos" class="tb-barras"></div>
      <h3>Destino correcto en cada misión</h3>
      <div id="tb-misiones" class="tb-barras tb-barras-sm"></div>
      <h3>Aciertos contra el jefe final</h3>
      <div id="tb-preguntas" class="tb-barras tb-barras-sm"></div>
      <details class="tb-tabla"><summary>Ver como tabla</summary><div id="tb-tabla"></div></details>
    </section>
    <section class="tb-panel tb-opinion">
      <h2><span aria-hidden="true">💬</span> Su opinión</h2>
      <div class="tb-tiles">
        <div class="tb-tile"><span class="tb-tile-etq">¿Entendieron el artículo?</span><span class="tb-tile-val"><b id="tb-entendiste">–</b><small>/ 5</small></span><div class="tb-dist" id="tb-dist-op_entendiste"></div></div>
        <div class="tb-tile"><span class="tb-tile-etq">¿Es innovador?</span><span class="tb-tile-val"><b id="tb-innovador">–</b><small>/ 5</small></span><div class="tb-dist" id="tb-dist-op_innovador"></div></div>
      </div>
      <h3>¿Reconocerían una endometriosis en consulta?</h3>
      <div id="tb-reconocerias" class="tb-apilada"></div>
      <div id="tb-reconocerias-ley" class="tb-leyenda"></div>
      <h3>Puntaje promedio por semestre</h3>
      <div id="tb-semestres" class="tb-barras tb-barras-sm"></div>
    </section>
  </main>
  <footer class="tb-pie">${d(a.autores)} · ${d(a.curso)} · ${d(a.docente)}</footer>
`;var v=u(`#tooltip`);document.addEventListener(`pointermove`,e=>{let t=e.target.closest(`[data-tip]`);if(!t){v.hidden=!0;return}v.textContent=t.dataset.tip,v.hidden=!1;let n=Math.min(window.innerWidth-v.offsetWidth-8,e.clientX+14);v.style.left=`${Math.max(8,n)}px`,v.style.top=`${e.clientY+16}px`});function y({id:e,etiqueta:t,valor:n,estudio:r,tip:i,texto:a}){let o=Math.max(0,Math.min(100,n??0));return`<div class="tb-fila" data-id="${e}" data-tip="${d(i)}">
    <span class="tb-fila-etq">${d(t)}</span>
    <span class="tb-pista">
      <i class="tb-relleno" style="width:${o}%"></i>
      ${r==null?``:`<i class="tb-ref" style="left:${r}%" aria-hidden="true"></i>`}
    </span>
    <span class="tb-fila-val">${a??f(n)}</span>
  </div>`}function b(e){u(`#tb-n`).textContent=e.participantes;let i=[`🥇`,`🥈`,`🥉`];u(`#tb-ranking`).innerHTML=e.ranking.map((e,t)=>`<li class="${t<3?`top`:``}">
          <span class="rk-pos">${i[t]||t+1}</span>
          <span class="rk-nom">${d(e.nombre)} <small>${d(e.semestre)}</small></span>
          <span class="rk-pts">${e.puntaje}</span></li>`).join(``)||`<li class="vacio">Esperando las primeras partidas…</li>`;let a=Object.values(e.avatares||{}).reduce((e,t)=>e+t,0)||1;u(`#tb-avatares`).innerHTML=s.map(t=>{let n=e.avatares?.[t.nombre]||0;return y({id:t.id,etiqueta:t.nombre,valor:100*n/a,tip:`${t.nombre}: ${n}`,texto:String(n)})}).join(``);let l=h.map(t=>({...t,valor:e.tarjetas?.[t.id]??null})).sort((e,t)=>(e.valor??101)-(t.valor??101));u(`#tb-signos`).innerHTML=l.map(e=>y({id:e.id,etiqueta:e.texto,valor:e.valor,estudio:e.estudio,tip:`${e.texto}: ${f(e.valor)} hoy${e.estudio===null?``:` · estudio: ${f(e.estudio)}`}`})).join(``),u(`#tb-misiones`).innerHTML=t.map((t,n)=>y({id:`m`+(n+1),etiqueta:`${t.nombre} → ${r[t.correcto].sala.toLowerCase()}`,valor:e.misiones?.[`m`+(n+1)]??null,tip:`${t.nombre}: destino correcto ${f(e.misiones?.[`m`+(n+1)])}`})).join(``),u(`#tb-preguntas`).innerHTML=o.map(t=>y({id:t.id,etiqueta:t.corta,valor:e.preguntas?.[t.id]??null,tip:`${t.pregunta} · acierto: ${f(e.preguntas?.[t.id])}`})).join(``),u(`#tb-tabla`).innerHTML=`<table><thead><tr><th>Signo de alarma</th><th>Taller</th><th>Estudio</th></tr></thead><tbody>${l.map(e=>`<tr><td>${d(e.texto)}</td><td>${f(e.valor)}</td><td>${f(e.estudio)}</td></tr>`).join(``)}</tbody></table>`,u(`#tb-entendiste`).textContent=p(e.promedios?.entendiste),u(`#tb-innovador`).textContent=p(e.promedios?.innovador),[`op_entendiste`,`op_innovador`].forEach(t=>{let n=e.distribucion?.[t.slice(3)]||{},r=Math.max(1,...Object.values(n)),i=c.find(e=>e.id===t);u(`#tb-dist-${t}`).innerHTML=i.opciones.map((e,i)=>{let a=n[String(e.valor)]||0;return`<span class="tb-col" data-tip="${d(e.texto)}: ${a} ${a===1?`persona`:`personas`}">
          <i style="height:${a/r*100}%"></i><b aria-hidden="true">${g[t][i]}</b><small>${a}</small></span>`}).join(``)});let v=e.distribucion?.reconocerias||{},b=Object.values(v).reduce((e,t)=>e+t,0);u(`#tb-reconocerias`).innerHTML=b?_.map(e=>{let t=v[e.valor]||0,n=100*t/b;return n>0?`<span class="seg-${e.clase}" style="width:${n}%" data-tip="${e.valor}: ${t} (${f(n)})">${n>=12?`${e.emoji} ${Math.round(n)} %`:``}</span>`:``}).join(``):`<span class="seg-vacio">Sin respuestas aún</span>`,u(`#tb-reconocerias-ley`).innerHTML=_.map(e=>`<span><i class="ley-${e.clase}"></i> ${e.emoji} ${e.valor}: <b>${v[e.valor]||0}</b></span>`).join(``);let x=[`II`,`VI`,`VIII`,`Otro`,`Docente`],S=e.porSemestre||[],C=Math.max(1,...S.map(e=>e.promedio||0));u(`#tb-semestres`).innerHTML=x.map(e=>{let t=S.find(t=>t.semestre===e);return y({id:`s`+e,etiqueta:`${e} (${t?t.n:0})`,valor:t?100*t.promedio/C:0,tip:`${e}: ${t?Math.round(t.promedio):`–`} puntos`,texto:t?String(Math.round(t.promedio)):`–`})}).join(``);let w=new Date(e.actualizado||Date.now()).toLocaleTimeString(`es-CO`,{hour:`2-digit`,minute:`2-digit`,second:`2-digit`});u(`#tb-actualizado`).textContent=`En vivo · ${w}`;let T=u(`#tb-aviso`);m?(T.hidden=!1,T.textContent=`DATOS DE DEMOSTRACIÓN (quita «?demo» de la dirección para ver los reales).`):e.origen===`nube`?T.hidden=!0:(T.hidden=!1,T.textContent=n()?`No se pudo conectar con Google Sheets: mostrando solo las partidas de este dispositivo. Reintentando…`:`Falta configurar APPS_SCRIPT_URL en config.js: mostrando solo las partidas de este dispositivo.`)}function x(){let n=[`Caro`,`Andrés`,`Vale`,`Dr. Pérez`,`Majo`,`Sebas`,`Laura`,`Nico`,`Dani`,`Profe Karen`,`Sofi`,`Juanjo`,`Isa`,`Mafe`],r=[`II`,`VI`,`VIII`,`Otro`,`Docente`],i=n.map((e,n)=>{let i={id:`demo`+n,nombre:e,semestre:r[n%5],avatar:s[n%3].nombre,puntaje:120+n*37%230,tiempo_total_s:180};return t.forEach(e=>e.orbes.forEach(e=>i[`t_`+e.id]=+(Math.random()<(e.estudio?e.estudio/100+.15:.7)))),o.forEach((e,t)=>i[e.id+`_ok`]=+(Math.random()<.4+t*.1)),[`m1`,`m2`,`m3`].forEach((e,t)=>i[e+`_ok`]=+(Math.random()<.55+t*.12)),i.op_entendiste=3+n%3,i.op_innovador=4+n%2,i.op_reconocerias=[`Sí`,`Sí`,`Tal vez`,`Sí`,`No`][n%5],i});return{...e(i),origen:`nube`}}async function S(){try{b(m?x():await i())}catch{u(`#tb-actualizado`).textContent=`Sin conexión · reintentando…`}}S(),setInterval(S,5e3);