/* =========================================================
   CINEXA — 화면 동작
   (메뉴, 스크롤 효과, 영상 미리보기·팝업, 문의 메일 보내기)
   ========================================================= */
(function () {
	'use strict';

	var doc = document.documentElement;
	doc.classList.remove('no-js');

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	/* ---------- 올해 연도 ---------- */
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	/* ---------- 상단 메뉴 ---------- */
	var nav = document.getElementById('nav');
	var toggle = document.getElementById('navToggle');

	function onScroll() {
		nav.classList.toggle('is-scrolled', window.scrollY > 40);
	}
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	function closeMenu() {
		nav.classList.remove('is-open');
		document.body.style.overflow = '';
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-label', '메뉴 열기');
	}

	toggle.addEventListener('click', function () {
		var open = !nav.classList.contains('is-open');
		nav.classList.toggle('is-open', open);
		// 메뉴가 열려 있는 동안 뒤의 페이지가 같이 굴러가지 않게
		document.body.style.overflow = open ? 'hidden' : '';
		toggle.setAttribute('aria-expanded', String(open));
		toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
	});

	document.querySelectorAll('.nav-links a').forEach(function (a) {
		a.addEventListener('click', closeMenu);
	});

	/* 지금 보고 있는 구역의 메뉴에 표시 */
	var navLinks = {};
	document.querySelectorAll('.nav-links a[href^="#"]:not(.nav-cta)').forEach(function (a) {
		navLinks[a.getAttribute('href').slice(1)] = a;
	});

	if ('IntersectionObserver' in window) {
		var sectionObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				var link = navLinks[entry.target.id];
				if (!link) return;
				if (entry.isIntersecting) {
					Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('is-active'); });
					link.classList.add('is-active');
				}
			});
		}, { rootMargin: '-45% 0px -50% 0px' });

		Object.keys(navLinks).forEach(function (id) {
			var el = document.getElementById(id);
			if (el) sectionObserver.observe(el);
		});
	}

	/* ---------- 스크롤하면 나타나는 효과 ---------- */
	var reveals = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && !reduceMotion) {
		var revealObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					revealObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
		reveals.forEach(function (el) { revealObserver.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add('is-visible'); });
	}

	/* ---------- 첫 화면 배경 영상 ---------- */
	var heroVideo = document.getElementById('heroVideo');
	if (heroVideo && reduceMotion) {
		heroVideo.removeAttribute('autoplay');
		heroVideo.pause();
	}

	/* ---------- 작업 카드 미리보기 ---------- */
	var cards = document.querySelectorAll('.work-card');

	function playPreview(card) {
		var v = card.querySelector('video');
		if (!v) return;
		if (!v.src) v.src = v.getAttribute('data-src');
		var p = v.play();
		if (p && p.then) {
			p.then(function () { card.classList.add('is-playing'); }).catch(function () { });
		} else {
			card.classList.add('is-playing');
		}
	}

	function stopPreview(card) {
		var v = card.querySelector('video');
		if (!v) return;
		v.pause();
		card.classList.remove('is-playing');
	}

	if (!reduceMotion) {
		if (canHover) {
			// 컴퓨터: 마우스를 올리면 재생
			cards.forEach(function (card) {
				card.addEventListener('mouseenter', function () { playPreview(card); });
				card.addEventListener('mouseleave', function () { stopPreview(card); });
			});
		} else if ('IntersectionObserver' in window) {
			// 휴대폰: 화면 가운데에 오면 재생
			var previewObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) playPreview(entry.target);
					else stopPreview(entry.target);
				});
			}, { threshold: 0.6 });
			cards.forEach(function (card) { previewObserver.observe(card); });
		}
	}

	/* ---------- 영상 팝업 ---------- */
	var player = document.getElementById('player');
	var playerVideo = document.getElementById('playerVideo');
	var playerTitle = document.getElementById('playerTitle');
	var playerDesc = document.getElementById('playerDesc');
	var playerClose = document.getElementById('playerClose');
	var lastFocus = null;

	function openPlayer(card) {
		lastFocus = card;
		cards.forEach(stopPreview);
		playerTitle.textContent = card.getAttribute('data-title');
		playerDesc.textContent = card.getAttribute('data-desc');
		playerVideo.src = card.getAttribute('data-video');
		player.hidden = false;
		// 다음 그림에서 열어야 부드럽게 나타나요
		requestAnimationFrame(function () {
			player.classList.add('is-open');
		});
		document.body.style.overflow = 'hidden';
		playerClose.focus();
		var p = playerVideo.play();
		if (p && p.catch) {
			p.catch(function () {
				// 소리 있는 자동재생이 막히면 소리를 끄고 재생
				playerVideo.muted = true;
				playerVideo.play().catch(function () { });
			});
		}
	}

	function closePlayer() {
		if (player.hidden) return;
		player.classList.remove('is-open');
		playerVideo.pause();
		document.body.style.overflow = '';
		setTimeout(function () {
			player.hidden = true;
			playerVideo.removeAttribute('src');
			playerVideo.load();
			playerVideo.muted = false;
		}, 350);
		if (lastFocus) lastFocus.focus();
	}

	cards.forEach(function (card) {
		card.addEventListener('click', function () { openPlayer(card); });
	});

	playerClose.addEventListener('click', closePlayer);
	player.addEventListener('click', function (e) {
		if (e.target === player) closePlayer();
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closePlayer();
			closeMenu();
		}
	});

	/* ---------- 문의 메일 보내기 (EmailJS) ---------- */
	var EMAILJS_PUBLIC_KEY = '6KoOToOnhXudVJ_J1';
	var EMAILJS_SERVICE = 'service_vamgq3e';
	var EMAILJS_TEMPLATE = 'template_oce4pjv';

	if (window.emailjs) window.emailjs.init(EMAILJS_PUBLIC_KEY);

	var form = document.getElementById('contactForm');
	var btn = document.getElementById('submitBtn');
	var statusEl = document.getElementById('formStatus');
	var btnLabel = btn.innerHTML;

	function showStatus(type, text) {
		statusEl.className = 'form-status ' + (type === 'ok' ? 'is-ok' : 'is-error');
		statusEl.textContent = text;
	}

	form.addEventListener('submit', function (e) {
		e.preventDefault();

		if (!form.checkValidity()) {
			var firstInvalid = form.querySelector(':invalid');
			var label = firstInvalid && form.querySelector('label[for="' + firstInvalid.id + '"]');
			showStatus('error', (label ? label.textContent.replace('(선택)', '').trim() : '입력값') + ' 칸을 확인해 주세요.');
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		if (!window.emailjs) {
			showStatus('error', '지금은 문의를 보낼 수 없어요. cinexa.ai@gmail.com 으로 메일을 보내주세요.');
			return;
		}

		var type = form.querySelector('input[name="inquiry_type"]:checked').value;
		var name = form.elements['name'].value.trim();
		var email = form.elements['email'].value.trim();
		var mobile = form.elements['mobile'].value.trim();
		var message = form.elements['message'].value.trim();

		var params = {
			from_name: name,
			from_email: email,
			name: name,
			email: email,
			mobile: mobile || '(없음)',
			inquiry_type: type,
			// 메일 양식에 '문의 종류' 칸이 없어도 보이도록 본문 맨 위에 붙여요
			message: '[문의 종류: ' + type + ']\n\n' + message,
			to_email: 'cinexa.ai@gmail.com',
			to_name: 'CINEXA'
		};

		btn.disabled = true;
		btn.textContent = '보내는 중…';
		statusEl.className = 'form-status';

		window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, params)
			.then(function () {
				showStatus('ok', '문의가 잘 전달됐어요. 확인 후 이메일로 연락드릴게요!');
				form.reset();
			})
			.catch(function (error) {
				console.error('EmailJS error:', error);
				showStatus('error', '전송에 실패했어요. 잠시 후 다시 시도하거나 cinexa.ai@gmail.com 으로 메일을 보내주세요.');
			})
			.then(function () {
				btn.disabled = false;
				btn.innerHTML = btnLabel;
			});
	});
})();
