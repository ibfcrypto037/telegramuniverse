document.addEventListener("DOMContentLoaded", () => {

    // Fade-in animation on scroll using IntersectionObserver
    const fadeSections = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeSections.forEach(section => {
        observer.observe(section);
    });

    // Handle Toggles
    const toggleWrappers = document.querySelectorAll('.toggle-wrapper');
    toggleWrappers.forEach(wrapper => {
        const btns = wrapper.querySelectorAll('.toggle-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                btns.forEach(b => b.classList.remove('active'));
                const targetBtn = e.target;
                targetBtn.classList.add('active');

                // Toggle visibility of associated auto/manual fields
                const targetArea = wrapper.getAttribute('data-target');
                const val = targetBtn.getAttribute('data-val');

                const autoFields = document.getElementById(`${targetArea}-auto-fields`);
                const manualFields = document.getElementById(`${targetArea}-manual-fields`);

                if (autoFields && manualFields) {
                    if (val === 'auto') {
                        autoFields.classList.remove('hidden');
                        manualFields.classList.add('hidden');
                        const manualInputs = manualFields.querySelectorAll('input');
                        manualInputs.forEach(i => i.value = '');
                    } else {
                        autoFields.classList.add('hidden');
                        manualFields.classList.remove('hidden');
                        const autoInputs = autoFields.querySelectorAll('input');
                        autoInputs.forEach(i => i.value = '');
                    }
                }
                if (typeof window.calculateRevenue === 'function') window.calculateRevenue();
            });
        });
    });

    // Number format utility
    const formatNumber = (num, currency = false) => {
        if (num === null || isNaN(num) || num < 0) return currency ? "$0" : "0";
        if (currency) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
        }
        return new Intl.NumberFormat('en-US').format(Math.floor(num));
    };



    // -------------------------------------------------------------------------
    // FAQ Accordion Logic
    // -------------------------------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                });

                if (!isActive) {
                    item.classList.add('active');
                    const answer = item.querySelector('.faq-answer');
                    if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });

    // -------------------------------------------------------------------------
    // Mobile Navigation Toggle
    // -------------------------------------------------------------------------
    const navToggle = document.getElementById('nav-toggle');
    const navLinksDOM = document.getElementById('nav-links');

    if (navToggle && navLinksDOM) {
        navToggle.addEventListener('click', () => {
            navLinksDOM.classList.toggle('nav-active');
            navToggle.classList.toggle('toggle');
        });
    }

    // -------------------------------------------------------------------------
    // Tool 1: Revenue Calculator Logic
    // -------------------------------------------------------------------------
    const revForm = document.getElementById('revenue-form');
    if (revForm) {
        const tierSelect = document.getElementById('sel-tier');
        if (tierSelect) {
            tierSelect.addEventListener('change', () => {
                window.calculateRevenue();
            });
        }

        const inpDays = document.getElementById('inp-days');
        if (inpDays) {
            inpDays.addEventListener('input', () => {
                window.calculateRevenue();
            });
        }

        // CPM ranges by tier (advertiser-side)
        const CPM_TIERS = {
            'tier1': { min: 2.00, avg: 3.50, max: 5.00 },
            'tier2': { min: 0.50, avg: 1.25, max: 2.00 },
            'tier3': { min: 0.10, avg: 0.55, max: 1.00 }
        };

        window.calculateRevenue = () => {
            const toggleWrapper = document.querySelector('.toggle-wrapper[data-target="revViews"]');
            let isAuto = false;
            if (toggleWrapper) {
                const activeBtn = toggleWrapper.querySelector('.toggle-btn.active');
                if (activeBtn && activeBtn.getAttribute('data-val') === 'auto') {
                    isAuto = true;
                }
            }

            let monthlyViews = 0;
            let warnings = [];

            if (!isAuto) {
                const manualViewsInput = document.getElementById('inp-monthly-views');
                const manualViews = manualViewsInput && manualViewsInput.value ? parseFloat(manualViewsInput.value) : 0;
                
                if (manualViews <= 0 || isNaN(manualViews)) {
                    warnings.push('Please enter your monthly views (> 0)');
                } else {
                    monthlyViews = manualViews;
                }
            } else {
                const viewsPerPostInput = document.getElementById('inp-views-per-post');
                const postsPerDayInput = document.getElementById('inp-posts-per-day');
                
                const viewsPerPost = viewsPerPostInput && viewsPerPostInput.value ? parseFloat(viewsPerPostInput.value) : 0;
                const postsPerDay = postsPerDayInput && postsPerDayInput.value ? parseFloat(postsPerDayInput.value) : 0;
                
                if (viewsPerPost <= 0 || postsPerDay <= 0 || isNaN(viewsPerPost) || isNaN(postsPerDay)) {
                    warnings.push('Please fill in both fields (> 0)');
                } else {
                    monthlyViews = viewsPerPost * postsPerDay * 30;
                }
            }

            const tier = document.getElementById('sel-tier').value || 'tier1';

            const warningEl = document.getElementById('rev-warning');
            const warningTextEl = document.getElementById('rev-warning-text');

            if (warnings.length > 0) {
                if (warningEl && warningTextEl) {
                    warningEl.classList.remove('hidden');
                    warningTextEl.textContent = warnings[0];
                }
            } else {
                if (warningEl) {
                    warningEl.classList.add('hidden');
                    if (warningTextEl) warningTextEl.textContent = '';
                }
            }

            // Show result card
            const repCard = document.getElementById('result-section');
            if (repCard) {
                repCard.style.display = 'block';
                repCard.style.opacity = '1';
                repCard.style.visibility = 'visible';
                repCard.classList.remove('hidden');
            }

            // Step 1: Base CPM for tier
            const tierCpm = CPM_TIERS[tier] || CPM_TIERS['tier1'];

            const days = parseFloat(document.getElementById('inp-days').value) || 30;
            const dailyViews = monthlyViews / 30;
            const periodViews = dailyViews * days;

            // Step 2: Your share after Telegram's 50% cut
            const yourMinCpm = tierCpm.min * 0.50;
            const yourAvgCpm = tierCpm.avg * 0.50;
            const yourMaxCpm = tierCpm.max * 0.50;

            // Step 3: Monthly & Period revenue
            const periodMin = (periodViews / 1000) * yourMinCpm;
            const periodAvg = (periodViews / 1000) * yourAvgCpm;
            const periodMax = (periodViews / 1000) * yourMaxCpm;

            const monthlyMin = (monthlyViews / 1000) * yourMinCpm;
            const monthlyAvg = (monthlyViews / 1000) * yourAvgCpm;
            const monthlyMax = (monthlyViews / 1000) * yourMaxCpm;

            // Step 4: Annual revenue
            const annualAvg = monthlyAvg * 12;

            // Render
            const calcMonthlyViewsEl = document.getElementById('res-calc-monthly-views');
            if (calcMonthlyViewsEl) calcMonthlyViewsEl.textContent = formatNumber(monthlyViews);

            const fullCpmEl = document.getElementById('res-full-cpm');
            if (fullCpmEl) fullCpmEl.textContent = '$' + tierCpm.avg.toFixed(2);

            const avgCpmEl = document.getElementById('res-avg-cpm');
            if (avgCpmEl) avgCpmEl.textContent = '$' + yourAvgCpm.toFixed(2);

            const lblAvg = document.getElementById('lbl-period-avg');
            if (lblAvg) lblAvg.textContent = `💰 Revenue for ${days} Days (Avg)`;
            const lblMin = document.getElementById('lbl-period-min');
            if (lblMin) lblMin.textContent = `Min for ${days} Days`;
            const lblMax = document.getElementById('lbl-period-max');
            if (lblMax) lblMax.textContent = `Max for ${days} Days`;

            const resPeriodMin = document.getElementById('res-period-min');
            if (resPeriodMin) resPeriodMin.textContent = formatNumber(periodMin, true);
            const resPeriodAvg = document.getElementById('res-period-avg');
            if (resPeriodAvg) resPeriodAvg.textContent = formatNumber(periodAvg, true);
            const resPeriodMax = document.getElementById('res-period-max');
            if (resPeriodMax) resPeriodMax.textContent = formatNumber(periodMax, true);

            document.getElementById('res-avg-rev').textContent   = formatNumber(monthlyAvg, true);
            document.getElementById('res-min-rev').textContent   = formatNumber(monthlyMin, true);
            document.getElementById('res-max-rev').textContent   = formatNumber(monthlyMax, true);
            document.getElementById('res-annual-rev').textContent = formatNumber(annualAvg, true);
        };

        const calcBtn = document.getElementById('btn-calc-revenue');
        if (calcBtn) {
            calcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.calculateRevenue();
            });
        }

        // Reset Button
        const resetBtn = document.getElementById('btn-reset-revenue');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                revForm.reset();
                window.calculateRevenue();
            });
        }
    }

    // -------------------------------------------------------------------------
    // Tool 2: Engagement Rate Logic
    // -------------------------------------------------------------------------
    const engForm = document.getElementById('engagement-form');
    if (engForm) {
        window.calculateEngagement = () => {
            const views = parseFloat(document.getElementById('inp-eng-views').value) || 0;
            const subscribers = parseFloat(document.getElementById('inp-eng-subscribers').value) || 0;

            let rate = 0;
            if (views > 0 && subscribers > 0) {
                rate = (views / subscribers) * 100;
                const repCard = document.getElementById('result-section');
                if (repCard) {
                    repCard.style.display = 'block';
                    repCard.style.opacity = '1';
                    repCard.style.visibility = 'visible';
                    repCard.classList.remove('hidden');
                }
            }

            document.getElementById('res-eng-rate').innerText = rate.toFixed(2) + '%';
        };

        const calcBtn = document.getElementById('btn-calc-engagement');
        if (calcBtn) {
            calcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.calculateEngagement();
            });
        }

        const resetBtn = document.getElementById('btn-reset-engagement');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                engForm.reset();
                window.calculateEngagement();
            });
        }
    }

    // -------------------------------------------------------------------------
    // Tool 3: CPM Logic
    // -------------------------------------------------------------------------
    const cpmForm = document.getElementById('cpm-form');
    if (cpmForm) {
        window.calculateCpm = () => {
            const views = parseFloat(document.getElementById('inp-cpm-views').value) || 0;
            const revenue = parseFloat(document.getElementById('inp-cpm-revenue').value) || 0;

            let cpmValue = 0;
            if (views > 0 && revenue > 0) {
                cpmValue = (revenue / views) * 1000;
                const repCard = document.getElementById('result-section');
                if (repCard) {
                    repCard.style.display = 'block';
                    repCard.style.opacity = '1';
                    repCard.style.visibility = 'visible';
                    repCard.classList.remove('hidden');
                }
            }

            document.getElementById('res-cpm-value').innerText = formatNumber(cpmValue, true);
        };

        const calcBtn = document.getElementById('btn-calc-cpm');
        if (calcBtn) {
            calcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.calculateCpm();
            });
        }

        const resetBtn = document.getElementById('btn-reset-cpm');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cpmForm.reset();
                window.calculateCpm();
            });
        }
    }

    // -------------------------------------------------------------------------
    // Tool 4: Growth Rate Logic
    // -------------------------------------------------------------------------
    const growthForm = document.getElementById('growth-form');
    if (growthForm) {
        window.calculateGrowth = () => {
            const oldSubs = parseFloat(document.getElementById('inp-old-subs').value) || 0;
            const newSubs = parseFloat(document.getElementById('inp-new-subs').value) || 0;

            let rate = 0;
            if (oldSubs > 0) {
                rate = ((newSubs - oldSubs) / oldSubs) * 100;
                if (newSubs > 0) {
                    const repCard = document.getElementById('result-section');
                    if (repCard) {
                        repCard.style.display = 'block';
                        repCard.style.opacity = '1';
                        repCard.style.visibility = 'visible';
                        repCard.classList.remove('hidden');
                    }
                }
            }

            const resElem = document.getElementById('res-growth-rate');
            resElem.innerText = (rate > 0 ? "+" : "") + rate.toFixed(2) + '%';

            if (rate > 0) resElem.style.color = '#10b981'; // green for positive
            else if (rate < 0) resElem.style.color = '#ef4444'; // red for negative
            else resElem.style.color = 'var(--text-primary)';
        };

        const calcBtn = document.getElementById('btn-calc-growth');
        if (calcBtn) {
            calcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.calculateGrowth();
            });
        }

        const resetBtn = document.getElementById('btn-reset-growth');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                growthForm.reset();
                window.calculateGrowth();
            });
        }
    }

    // -------------------------------------------------------------------------
    // Instagram Popup logic
    // -------------------------------------------------------------------------
    const popup = document.getElementById('popup');
    const isHomePage = window.location.pathname === '/'
        || window.location.pathname.includes('index.html')
        || window.location.pathname.endsWith('/');

    if (popup && isHomePage) {
        const hasSeenPopup = localStorage.getItem('popupShown');
        
        if (!hasSeenPopup) {
            popup.style.display = 'none';
            popup.style.opacity = '0';
            
            setTimeout(() => {
                popup.style.display = 'flex';
                popup.style.transition = 'opacity 0.4s ease';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        popup.style.opacity = '1';
                    });
                });
            }, 2000);
        }

        const closePopup = () => {
            popup.style.opacity = '0';
            localStorage.setItem('popupShown', 'true');
            setTimeout(() => {
                popup.style.display = 'none';
            }, 400);
        };

        const closeBtn = document.getElementById('popup-close-btn');
        const skipBtn = document.getElementById('popup-skip-btn');
        const followBtn = document.getElementById('popup-follow-btn');

        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (skipBtn) skipBtn.addEventListener('click', closePopup);
        if (followBtn) followBtn.addEventListener('click', closePopup);
    }

});
