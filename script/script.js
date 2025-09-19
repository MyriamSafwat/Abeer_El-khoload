
(function(){
  "use strict";

  // Helper: format number Arabic
  const fmt = n => Number(n).toLocaleString('ar-EG');

  // Build product map from DOM (#products .card[data-id])
  const products = {};
  document.querySelectorAll('#products .card[data-id]').forEach(card => {
    const id = card.dataset.id;
    const priceText = card.dataset.price || (card.querySelector('.product-price')?.innerText || '0');
    const price = Number(String(priceText).replace(/[^\d.]/g, '')) || 0;
    const img = card.dataset.img || (card.querySelector('img')?.src || '');
    const name = card.dataset.name || (card.querySelector('.card-title')?.innerText || 'منتج');
    const desc = card.querySelector('.card-text')?.innerText || '';
    products[String(id)] = { id: Number(id), name: name.trim(), price, img, desc };
  });

  // Load cart from localStorage
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  function persist() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateBadges();
    renderCartIfNeeded();
  }

  function updateBadges() {
    const count = cart.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const el1 = document.getElementById('btn-cart-count'); 
    const el2 = document.getElementById('ak-cart-count');  
    if (el1) el1.textContent = count;
    if (el2) el2.textContent = count;
  }

  function addToCart(product) {
    if (!product || !product.id) return;
    const existing = cart.find(p => Number(p.id) === Number(product.id));
    if (existing) existing.qty = (Number(existing.qty) || 0) + 1;
    else cart.push({ id: Number(product.id), name: product.name, price: Number(product.price) || 0, img: product.img || '', qty: 1 });
    persist();
  }

  // Expose helper for manual use
  window.addProductToCart = function(name, price, img){
    const existing = cart.find(p => p.name === name);
    if (existing) existing.qty++;
    else cart.push({ id: Date.now(), name, price: Number(price) || 0, img: img || '', qty: 1 });
    persist();
  };

  // Render checkout table
  function renderCartIfNeeded(){
    const tbody = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!tbody || !totalEl) return;

    tbody.innerHTML = '';
    if (cart.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">سلة فارغة</td></tr>`;
      totalEl.textContent = '0';
      return;
    }

    let total = 0;
    cart.forEach(item => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const subtotal = price * qty;
      total += subtotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center">
            <img src="${item.img}" alt="${item.name}" width="60px" class="me-2 rounded">
            <h6 class="fw-bold" item-name>${item.name}</h6>
          </div>

        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center gap-2">
            <button class="btn btn-sm btn-outline-light qty-minus" data-id="${item.id}">−</button>
            <span class="px-2 qty-value">${item.qty}</span>
            <button class="btn btn-sm btn-outline-light qty-plus" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="text-center">${fmt(price)}</td>
        <td class="text-center">${fmt(subtotal)}</td>
        <td class="text-center"><button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}">حذف</button></td>
      `;
      tbody.appendChild(tr);
    });

    totalEl.textContent = fmt(total);
  }

  // Global functions for compatibility
  window.updateQty = function(id, delta) {
    const idx = cart.findIndex(p => Number(p.id) === Number(id));
    if (idx === -1) return;
    cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 0) + Number(delta));
    persist();
  };

  window.removeItem = function(id) {
    cart = cart.filter(p => Number(p.id) !== Number(id));
    persist();
  };

  // Delegated handlers for + / - / حذف
  document.addEventListener('click', (e) => {
    const plus = e.target.closest('.qty-plus');
    const minus = e.target.closest('.qty-minus');
    const del = e.target.closest('.remove-item');

    if (plus) {
      const id = plus.dataset.id;
      window.updateQty(id, 1);
    }
    if (minus) {
      const id = minus.dataset.id;
      const item = cart.find(p => String(p.id) === String(id));
      if (item && item.qty > 1) window.updateQty(id, -1);
      else window.removeItem(id);
    }
    if (del) {
      const id = del.dataset.id;
      window.removeItem(id);
    }
  });

  // Coupon
  window.applyCoupon = function() {
    const code = (document.getElementById('coupon')?.value || '').trim();
    if (!code) { alert('ادخلي كود الخصم'); return; }
    const total = cart.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 0), 0);
    if (code === 'DISCOUNT10') {
      const newTotal = Math.round(total * 0.9);
      document.getElementById('cart-total') && (document.getElementById('cart-total').textContent = fmt(newTotal));
      alert('تم تطبيق خصم 10%');
    } else alert('كود غير صالح');
  };

  // Fly-to-cart animation
  function flyToCart(imgEl) {
    if (!imgEl) return;
    const cartEl = document.getElementById('ak-cart-btn') || document.querySelector('a[href*="checkout"]');
    const imgRect = imgEl.getBoundingClientRect();
    const cartRect = cartEl ? cartEl.getBoundingClientRect() : { left: window.innerWidth - 50, top: 20, width: 30, height: 30 };

    const clone = imgEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = imgRect.left + 'px';
    clone.style.top = imgRect.top + 'px';
    clone.style.width = imgRect.width + 'px';
    clone.style.height = imgRect.height + 'px';
    clone.style.transition = 'transform 0.9s cubic-bezier(.2,.9,.2,1), opacity 0.9s linear';
    clone.style.zIndex = 99999;
    clone.classList.add('ak-fly');
    document.body.appendChild(clone);

    const imgCenterX = imgRect.left + imgRect.width / 2;
    const imgCenterY = imgRect.top + imgRect.height / 2;
    const cartCenterX = cartRect.left + cartRect.width / 2;
    const cartCenterY = cartRect.top + cartRect.height / 2;
    const dx = cartCenterX - imgCenterX;
    const dy = cartCenterY - imgCenterY;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.18)`;
      clone.style.opacity = '0.5';
    });

    setTimeout(() => {
      try { clone.remove(); } catch (e) {}
      if (cartEl) { cartEl.classList.add('ak-cart-bounce'); setTimeout(() => cartEl.classList.remove('ak-cart-bounce'), 420); }
    }, 950);
  }

  // Bind product cards
  document.querySelectorAll('#products .card[data-id]').forEach(card => {
    const btn = card.querySelector('.add-to-cart, .ak-buy-btn, .buy-btn');
    if (!btn) return;
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = card.dataset.id;
      const product = products[String(id)];
      const imgEl = card.querySelector('img');
      if (imgEl) flyToCart(imgEl);
      addToCart(product);
    });
  });

  // Wizard
  const wizard = {
    answers: [],
    steps: Array.from(document.querySelectorAll('.ak-step')),
    lastProduct: null,
    showStep(n) {
      this.steps.forEach(s => s.classList.remove('ak-active'));
      const el = document.getElementById('ak-step-' + n);
      if (el) { el.classList.add('ak-active'); try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    },
    decideProduct() {
      const answers = this.answers.join('|').toLowerCase();
      if (answers.includes('ليل') || answers.includes('مناسبة')) return '4'; 
      if (answers.includes('أخشاب') || answers.includes('دفء')) return '2'; 
      if (answers.includes('زهور') || answers.includes('رومانسية')) return '3'; 
      if (answers.includes('انتعاش') || answers.includes('فواكه')) return '1'; 
      return Object.keys(products)[0] || '1';
    },
    showResult() {
      const pid = this.decideProduct();
      const el = document.querySelector(`#products .card[data-id='${pid}']`);
      if (!el) return;
      const name = el.dataset.name || el.querySelector('.card-title')?.innerText || '';
      const desc = el.querySelector('.card-text')?.innerText || '';
      const price = Number(String(el.dataset.price || el.querySelector('.product-price')?.innerText || '0').replace(/[^\d.]/g, '')) || 0;
      const img = el.querySelector('img')?.src || '';

      const nameEl = document.getElementById('ak-perfume-name');
      const commentEl = document.getElementById('ak-perfume-comment');
      const imgEl = document.getElementById('ak-perfume-img');
      const priceEl = document.getElementById('ak-perfume-price');

      if (nameEl) nameEl.textContent = name;
      if (commentEl) commentEl.textContent = desc;
      if (imgEl) imgEl.src = img;
      if (priceEl) priceEl.textContent = price + ' ج.م';

      this.lastProduct = { id: Number(pid), name, price, img, desc };

      this.steps.forEach(s => s.classList.remove('ak-active'));
      const res = document.getElementById('ak-result');
      if (res) { res.classList.add('ak-active'); try { res.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    }
  };

  document.querySelectorAll('.ak-answer-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const val = btn.dataset.answer || btn.innerText || '';
      wizard.answers.push(val.trim());
      const parent = btn.closest('.ak-step');
      const stepIndex = Number(parent?.dataset.step || '1');
      const next = stepIndex + 1;
      if (parent) { parent.classList.remove('ak-active'); }
      if (next <= 3) wizard.showStep(next); else wizard.showResult();
    });
  });

  const akBuy = document.getElementById('ak-buy-btn');
  if (akBuy) {
    akBuy.addEventListener('click', function(ev) {
      ev.preventDefault();
      if (!wizard.lastProduct) return;
      const img = document.getElementById('ak-perfume-img');
      if (img) flyToCart(img);
      addToCart(wizard.lastProduct);
    });
  }

  // Favorites toggle
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', function(ev){
      ev.preventDefault();
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      if (!icon) return;
      if (btn.classList.contains('active')) {
        icon.classList.remove('bi-heart'); icon.classList.add('bi-heart-fill'); icon.style.color = 'red';
      } else {
        icon.classList.remove('bi-heart-fill'); icon.classList.add('bi-heart'); icon.style.color = 'gray';
      }
    });
  });

  // 3D hover
  document.querySelectorAll('.ak-rotate-wrap').forEach(wrap => {
    const target = wrap.querySelector('.ak-rotate-target');
    if (!target) return;
    wrap.addEventListener('mousemove', function(e){
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 30;
      const rotateX = ((y / rect.height) - 0.5) * -30;
      target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    wrap.addEventListener('mouseleave', function(){ target.style.transform = 'rotateX(0deg) rotateY(0deg)'; });
  });

  // Init
  updateBadges();
  renderCartIfNeeded();

})();


fetch("http://localhost/your_project/api.php")
  .then(res => res.json())
  .then(data => {
    let productsDiv = document.getElementById("products");
    productsDiv.innerHTML = "";
    data.forEach(p => {
      productsDiv.innerHTML += `
        <div class="col-12 col-sm-6 col-md-6 col-lg-4">
          <div class="card text-center bg-black border-gold">
            <img src="${p.image}" class="card-img-top" alt="${p.name}">
            <div class="card-body">
              <h5 class="text-gold">${p.name}</h5>
              <p>${p.description || ""}</p>
              <p class="text-gold">${p.price} ج.م</p>
              <button class="btn-gold">شراء الآن</button>
            </div>
          </div>
        </div>
      `;
    });
  });
