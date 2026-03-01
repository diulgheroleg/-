(function(){
  function getNumFromString(s){
    const m = String(s).match(/(\d+)(?!.*\d)/); // last number
    return m ? parseInt(m[1],10) : -1;
  }
  function tierRank(name){
    const n = String(name).toLowerCase();
    if(n.includes("pro max")) return 6;
    if(n.includes("pro")) return 5;
    if(n.includes("plus")) return 4;
    if(n.includes("mini")) return 2;
    if(n.includes("se")) return 1;
    return 3;
  }
  function sortModelsDesc(a,b){
    const na=getNumFromString(a.modelName), nb=getNumFromString(b.modelName);
    if(na!==nb) return nb-na;
    const ta=tierRank(a.modelName), tb=tierRank(b.modelName);
    if(ta!==tb) return tb-ta;
    return String(a.modelName).localeCompare(String(b.modelName),"ru");
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  window.renderModelCards = function(containerId, models, opts){
    const el = document.getElementById(containerId);
    if(!el) return;
    const options = opts || {};
    const limit = options.previewLimit ?? 3;
    const maxModels = options.maxModels ?? null; // show only N models (e.g., 15–20 popular)

    let sorted = [...(models||[])].sort(sortModelsDesc);
    if(Number.isFinite(maxModels) && maxModels > 0){
      sorted = sorted.slice(0, maxModels);
    }

    el.innerHTML = sorted.map(m=>{
      const preview = (m.services||[]).slice(0, limit);
      const rows = preview.map(s=>`
        <div class="card__line">
          <div class="card__service">${escapeHtml(s.name)}</div>
          <div class="card__price">${escapeHtml(s.price)}</div>
        </div>
      `).join("");

      return `
        <div class="card model-card">
          <div class="card__title">${escapeHtml(m.modelName)}</div>
          ${rows || `<div class="card__empty">Нет данных по услугам</div>`}
          <div class="card__footer">
            <a class="card-btn-orange js-open-services" href="#"
               data-model="${escapeHtml(m.modelKey)}"
               data-title="${escapeHtml(m.modelName)}">
              <span class="icon">🛠</span>Все услуги ${escapeHtml(m.modelName)}
            </a>
          </div>
        </div>
      `;
    }).join("");
  };

  window.getBrandModels = function(brandKey){
    const b = (window.DEVICE_DATA||{})[brandKey];
    return b ? (b.models||[]) : [];
  };
})();
