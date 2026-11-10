const $ = (selector) => document.querySelector(selector);
const media = (name) => "media/" + name + ".webp";
const modelUrl = (p) => "modelo.html?id=" + p.id;
const dialog = $("#dialog");
const modal = $("#modalContent");
const params = new URLSearchParams(location.search);
const activeProduct = produtos.find(p => p.id === params.get("id"));
const menu = $(".menu");
menu.onclick = () => {
  const opened = $("nav").classList.toggle("open");
  menu.setAttribute("aria-expanded", String(opened));
  menu.setAttribute("aria-label", opened ? "Fechar menu" : "Abrir menu");
};
$("nav").onclick = () => { $("nav").classList.remove("open"); menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Abrir menu"); };
dialog.querySelector(".close").onclick = () => dialog.close();
dialog.onclick = e => { if(e.target===dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();} };
dialog.onclose = () => {document.body.style.overflow="";dialog.classList.remove("viewer");modal.replaceChildren();};
function openDialog(label) {
  dialog.setAttribute("aria-label",label);
  dialog.showModal();
  document.body.style.overflow="hidden";
}
function copyPreview(title, value, label) {
  modal.innerHTML = '<h2></h2><p></p><textarea aria-label="Texto para copiar" readonly></textarea><button class="primary" id="copy">Copiar</button> <span class="status" role="status"></span>';
  modal.querySelector("h2").textContent=title;
  modal.querySelector("p").textContent=label;
  const field=modal.querySelector("textarea");
  field.value=value;
  $("#copy").onclick=async () => {
    let ok=false;
    try {await navigator.clipboard.writeText(value);ok=true;} catch {field.focus();field.select();ok=document.execCommand("copy");}
    modal.querySelector(".status").textContent=ok?"Copiado!":"Selecione e copie o texto acima.";
  };
  openDialog(title);
}
function whatsappUrl(p) {
  const message = p
    ? 'Olá, Sarah! Vi a empilhadeira '+p.marca+' '+p.modelo+' no seu site e gostaria de saber o valor e a disponibilidade. '+new URL(modelUrl(p),location.href).href
    : 'Olá, Sarah! Gostaria de ajuda para escolher uma empilhadeira.';
  return "https://wa.me/"+contato.whatsapp+"?text="+encodeURIComponent(message);
}
function viewer(fotos, index, title) {
  dialog.classList.add("viewer");
  modal.innerHTML='<img><div class="viewerbar"><button aria-label="Foto anterior">←</button><span aria-live="polite"></span><button aria-label="Próxima foto">→</button></div>';
  const show=(delta=0)=>{
    index=(index+delta+fotos.length)%fotos.length;
    modal.querySelector("img").src=media(fotos[index]);modal.querySelector("img").alt=title+", foto "+(index+1);
    modal.querySelector("span").textContent=(index+1)+" / "+fotos.length;
  };
  const buttons=modal.querySelectorAll("button");
  buttons[0].onclick=()=>show(-1);buttons[1].onclick=()=>show(1);
  modal.onkeydown=e=>{if(e.key==="ArrowLeft")show(-1);if(e.key==="ArrowRight")show(1);};
  let start;
  modal.ontouchstart=e=>{start=e.changedTouches[0].clientX;};
  modal.ontouchend=e=>{const d=e.changedTouches[0].clientX-start;if(Math.abs(d)>50)show(d>0?-1:1);};
  dialog.addEventListener("close",()=>{modal.onkeydown=null;modal.ontouchstart=null;modal.ontouchend=null;},{once:true});
  show();openDialog(title);
}
if($("#cards")) {
  const brands=["Todas","Lonking","Hangcha"];
  let brand=brands.includes(params.get("marca"))?params.get("marca"):"Todas";
  const cap=$("#cap"),fuel=$("#fuel");
  function render(){
    $("#brands").replaceChildren(...brands.map(name=>{
      const b=document.createElement("button");b.textContent=name;b.setAttribute("aria-pressed",String(name===brand));
      b.onclick=()=>{brand=name;render();};return b;
    }));
    const list=produtos.filter(p=>(brand==="Todas"||p.marca===brand)&&(!cap.value||p.capacidade===cap.value)&&(!fuel.value||p.alimentacao===fuel.value));
    $("#cards").innerHTML=list.map(p=>`<a class="card" href="${modelUrl(p)}"><div class="pic"><img loading="lazy" src="${media(p.fotos[0]+"-sm")}" srcset="${media(p.fotos[0]+"-sm")} 480w, ${media(p.fotos[0])} 1478w" sizes="(max-width:700px) 92vw, 30vw" alt="Empilhadeira ${p.marca} ${p.modelo}"></div><small>${p.marca}</small><h3>${p.modelo}</h3><p>${p.capacidade} · ${p.alimentacao}</p><b>Ver detalhes ↗</b></a>`).join("")||'<div class="empty">Nenhum modelo com esses filtros. <button>Limpar filtros</button></div>';
    const clear=$(".empty button");if(clear)clear.onclick=()=>{brand="Todas";cap.value=fuel.value="";render();};
    const url=new URL(location.href);
    for(const [key,value] of [["marca",brand==="Todas"?"":brand],["capacidade",cap.value],["alimentacao",fuel.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
    if(location.protocol!=="file:")history.replaceState(null,"",url);
  }
  cap.value=params.get("capacidade")||"";fuel.value=params.get("alimentacao")||"";
  cap.onchange=fuel.onchange=render;render();
  document.querySelectorAll("[data-brand]").forEach(a=>a.onclick=e=>{e.preventDefault();brand=a.dataset.brand;cap.value=fuel.value="";render();location.hash="catalogo";$("#catalogo").scrollIntoView();});
  const deliveries=["entrega-1","entrega-2","entrega-3","entrega-4"];
  deliveries.forEach((name,i)=>{const b=document.createElement("button");b.setAttribute("aria-label","Ampliar registro de entrega "+(i+1));b.innerHTML='<img loading="lazy" src="'+media(name)+'" alt="Registro de entrega '+(i+1)+'"><span class="zoom" aria-hidden="true">⤢</span>';b.onclick=()=>viewer(deliveries,i,"Entregas realizadas");$("#delivery").append(b);});
  const rail=$("#delivery");
  function stepDelivery(direction) {
    const slides=Array.from(rail.children);
    const current=slides.reduce((best,slide,i)=>Math.abs(slide.offsetLeft-rail.scrollLeft)<Math.abs(slides[best].offsetLeft-rail.scrollLeft)?i:best,0);
    const next=(current+direction+slides.length)%slides.length;
    rail.scrollTo({left:slides[next].offsetLeft,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  $("#prevDelivery").onclick=()=>stepDelivery(-1);
  $("#nextDelivery").onclick=()=>stepDelivery(1);
  const film=$("#video");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  function syncFilm(){if(reduced.matches)film.pause();else film.play().catch(()=>{});}
  reduced.addEventListener("change",syncFilm);
  syncFilm();
}
if($("#produto")){
  const p=activeProduct;
  if(!p)$("#produto").innerHTML="<h1>Modelo não encontrado</h1><p>Volte ao catálogo para escolher uma empilhadeira.</p>";
  else{
    document.title=p.marca+" "+p.modelo+" | Sarah Máquinas";
    const specs={"Capacidade":p.capacidade,"Alimentação":p.alimentacao,...p.ficha,"Garantia":p.garantia,"Frete":p.frete};
    $("#produto").innerHTML=`<article class="product"><div><button class="product-photo" aria-label="Ampliar foto de ${p.marca} ${p.modelo}"><img><span class="zoom">⤢ Ampliar</span></button><div class="thumbs"></div></div><div><p class="kicker"><i></i> EMPILHADEIRA · ${p.marca.toUpperCase()}</p><h1>${p.marca} ${p.modelo}</h1><p>${p.capacidade} · ${p.alimentacao}</p><div class="actions"><a class="primary" data-consulta data-modelo href="${whatsappUrl(p)}" target="_blank" rel="noopener noreferrer">Consultar este modelo ↗</a><button class="share">Copiar link</button></div><h2>Ficha técnica</h2><dl>${Object.entries(specs).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join("")}</dl><h2>Condições de pagamento</h2><p class="commercial">${p.pagamento}</p></div></article>`;
    let selected=0;
    function select(i){selected=i;$(".product-photo img").src=media(p.fotos[i]);$(".product-photo img").alt=p.marca+" "+p.modelo+", vista "+(i+1);document.querySelectorAll(".thumbs button").forEach((b,j)=>b.setAttribute("aria-pressed",String(i===j)));}
    p.fotos.forEach((f,i)=>{const b=document.createElement("button");b.setAttribute("aria-label","Ver foto "+(i+1));b.innerHTML='<img src="'+media(f)+'" alt="">';b.onclick=()=>select(i);$(".thumbs").append(b);});
    select(0);$(".product-photo").onclick=()=>viewer(p.fotos,selected,p.marca+" "+p.modelo);
    $(".share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$(".share").textContent="Link copiado ✓";}catch{copyPreview("Link do modelo",location.href,"Copie o endereço para compartilhar esta máquina.");}};
  }
}
