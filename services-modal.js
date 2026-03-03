(function(){
  const modal = document.getElementById('servicesModal');
  if(!modal) return;

  const titleEl = modal.querySelector('[data-modal-title]');
  const subEl   = modal.querySelector('[data-modal-sub]');
  const listEl  = modal.querySelector('[data-modal-list]');
  const closeBtns = modal.querySelectorAll('[data-modal-close]');
  const backdrop = modal.querySelector('.services-modal__backdrop');

  function escapeHtml(str){
    return String(str ?? '').replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function openTelegram(text){
    const shareUrl = 'https://t.me/share/url?url=&text=' + encodeURIComponent(text);
    window.open(shareUrl, '_blank', 'noopener');
    try { navigator.clipboard?.writeText(text); } catch(e) {}
  }

  function findModelByKey(modelKey){
    const data = window.DEVICE_DATA || {};
    for(const brand in data){
      const models = (data[brand] && data[brand].models) || [];
      const found = models.find(m => m.modelKey === modelKey);
      if(found) return { brandKey: brand, model: found };
    }
    return null;
  }

  function buildFullTitle(brandKey, modelName){
    const data = window.DEVICE_DATA || {};
    const brandLabel = brandKey === 'iphone' ? 'iPhone' : ((data[brandKey] && data[brandKey].brand) ? data[brandKey].brand : brandKey);
    const b = (brandLabel || '').trim();
    const m = (modelName || '').trim();
    if(!b) return m;
    if(!m) return b;
    const bl = b.toLowerCase();
    const ml = m.toLowerCase();
    if(ml === bl) return m;
    if(ml.startsWith(bl + ' ') || ml.startsWith(bl)) return m;
    return b + ' ' + m;
  }

  function renderServices(services, fullTitle){
    const rows = [];
    for(let i=0;i<services.length;i+=2){
      const a = services[i];
      const b = services[i+1] || null;

      const cell = (s)=>{
        if(!s) return `<div class="svc-cell" style="visibility:hidden"></div>`;
        const msg = `Здравствуйте! Хочу записаться на ремонт.\n\n${fullTitle}\nУслуга: ${s.name}\nЦена: ${s.price}\n\n(сообщение с сайта)`;
        return `
          <div class="svc-cell">
            <div class="svc-info">
              <div class="svc-name">${escapeHtml(s.name)}</div>
              <div class="svc-price">${escapeHtml(s.price || 'Цена по запросу')}</div>
            </div>
            <button class="svc-btn" type="button" data-tg="${escapeHtml(msg)}">Записаться</button>
          </div>
        `;
      };

      rows.push(`<div class="svc-row">${cell(a)}${cell(b)}</div>`);
    }
    return `<div class="svc-table">${rows.join('')}</div>`;
  }

  function open(modelKey, overrideTitle){
    const found = findModelByKey(modelKey);
    const model = found?.model || null;

    const displayTitle = overrideTitle || (model ? model.modelName : 'Услуги');
    if(titleEl) titleEl.textContent = displayTitle;
    if(subEl) subEl.textContent = model ? 'Цены и услуги' : 'Данные не найдены';

    if(listEl){
      if(!model || !(model.services||[]).length){
        listEl.innerHTML = '<div class="services-empty">Нет данных по этой модели. Напиши нам — уточним цены.</div>';
      } else {
        const fullTitle = buildFullTitle(found.brandKey, model.modelName);
        listEl.innerHTML = renderServices(model.services, fullTitle);
      }
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }

  function close(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  window.openServices = function(modelKey, title){
    open(modelKey, title);
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.js-open-services');
    if(btn){
      e.preventDefault();
      const key = btn.getAttribute('data-model');
      const t = btn.getAttribute('data-title') || btn.textContent.trim();
      open(key, t);
      return;
    }

    const tgBtn = e.target.closest('[data-tg]');
    if(tgBtn && modal.classList.contains('is-open')){
      const msg = tgBtn.getAttribute('data-tg') || '';
      openTelegram(msg);
      return;
    }
  });

  closeBtns.forEach(b=>b.addEventListener('click', close));
  if(backdrop) backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();