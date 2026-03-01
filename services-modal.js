(function(){
  const modal = document.getElementById('servicesModal');
  if(!modal) return;

  const titleEl = modal.querySelector('[data-modal-title]');
  const subEl   = modal.querySelector('[data-modal-sub]');
  const listEl  = modal.querySelector('[data-modal-list]');
  const closeBtns = modal.querySelectorAll('[data-modal-close]');
  const backdrop = modal.querySelector('.services-modal__backdrop');

  function findModelByKey(modelKey){
    const data = window.DEVICE_DATA || {};
    for(const brand in data){
      const models = (data[brand] && data[brand].models) || [];
      const found = models.find(m => m.modelKey === modelKey);
      if(found) return found;
    }
    return null;
  }

  function open(modelKey, overrideTitle){
    const model = findModelByKey(modelKey);
    const title = overrideTitle || (model ? model.modelName : 'Услуги');
    if(titleEl) titleEl.textContent = title;
    if(subEl) subEl.textContent = model ? 'Цены и услуги' : 'Данные не найдены';

    if(listEl){
      if(!model || !(model.services||[]).length){
        listEl.innerHTML = '<div class="services-empty">Нет данных по этой модели. Напиши нам — уточним цены.</div>';
      } else {
        listEl.innerHTML = (model.services||[]).map(s => `
          <div class="service-row">
            <div class="service-row__name">${escapeHtml(s.name)}</div>
            <div class="service-row__price">${escapeHtml(s.price)}</div>
          </div>
        `).join('');
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

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
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
    }
  });

  closeBtns.forEach(b=>b.addEventListener('click', close));
  if(backdrop) backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
