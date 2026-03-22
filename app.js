gsap.registerPlugin(ScrollTrigger);

const dataFiles = [
    '01_2017_business.md',
    '02_2025_05_gifts.md',
    '03_2025_06_real_estate.md',
    '04_2025_06_real_estate_intl.md',
    '05_2025_10_crypto.md',
    '06_2025_11_media.md',
    '07_2025_12_crypto_uae.md',
    '08_2025_year_total.md',
    '09_2026_01_settlements.md',
    '10_2026_03_crypto_pardon.md',
    '11_2026_03_total.md',
    'event_2016_11_election.md',
    'event_2017_01_inauguration.md',
    'event_2021_01_capitol.md',
    'event_2021_01_leave.md',
    'event_2024_11_election.md',
    'event_2025_01_inauguration.md',
    'event_1985_losses.md',
    'event_1990_forbes_drop.md',
    'event_1991_taj_mahal.md',
    'event_1992_plaza_castle.md',
    'event_1995_nol.md',
    'event_2004_hotels_casino.md',
    'event_2009_bankruptcies.md',
    'event_2009_loss.md',
    'event_2014_6th_bankruptcy.md',
    'event_2015_loss.md'
];

let allData = [];

function parseMarkdownWithFrontmatter(markdownText) {
    const regex = /^---\s*[\n\r]([\s\S]*?)[\n\r]---[\n\r]([\s\S]*)$/;
    const match = markdownText.match(regex);
    if (match) {
        const frontmatter = jsyaml.load(match[1]);
        const content = match[2];
        return { data: frontmatter, content: content };
    }
    return { data: {}, content: markdownText };
}

async function loadData() {
    const fetches = dataFiles.map(file => fetch(`data/${file}`).then(res => res.text()));
    const texts = await Promise.all(fetches);
    
    allData = texts.map((text, index) => {
        const parsed = parseMarkdownWithFrontmatter(text);
        return {
            id: `item-${index}`,
            ...parsed.data,
            htmlContent: marked.parse(parsed.content)
        };
    });
    
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderTimeline(allData);
    document.querySelector('.loading').style.opacity = '0';
    setTimeout(() => document.querySelector('.loading').remove(), 500);
}

function renderTimeline(data) {
    const container = document.getElementById('timeline-container');
    document.querySelectorAll('.timeline-item, .historical-item, .timeline-gap').forEach(el => el.remove());
    
    let prevDate = null;

    data.forEach(item => {
        const itemDate = new Date(item.date);
        if (prevDate) {
            const diffYears = itemDate.getFullYear() - prevDate.getFullYear();
            if (diffYears >= 2) {
                const gapDiv = document.createElement('div');
                gapDiv.className = 'timeline-gap';
                gapDiv.innerHTML = `<span class="gap-dots">...</span><div class="gap-text">Salto de ${diffYears} años</div>`;
                container.appendChild(gapDiv);
            }
        }
        prevDate = itemDate;

        const div = document.createElement('div');
        div.id = item.id;
        div.setAttribute('data-date', item.date);
        div.setAttribute('data-type', item.type || '');
        
        let bgImageHTML = item.image ? `<div class="card-bg-image" style="background-image: url('images/${item.image}');"></div>` : '';

        let sourcesHTML = '';
        if (item.sources && item.sources.length > 0) {
            sourcesHTML = '<div class="item-sources"><strong>Fuentes de Consulta:</strong><ul>' + 
                item.sources.map(s => `<li><a href="${s.url}" target="_blank">${s.name}</a></li>`).join('') +
                '</ul></div>';
        }

        if (item.type === 'historical_event') {
            div.className = 'historical-item financial-item';
            div.setAttribute('data-value', 0);
            div.innerHTML = `
                ${bgImageHTML}
                <div class="hist-content card-content-wrapper">
                    <div class="hist-title">${item.title}</div>
                    <div class="item-content">${item.htmlContent || ''}</div>
                    ${sourcesHTML}
                </div>
            `;
        } else {
            div.className = `timeline-item financial-item ${item.is_conflict_of_interest ? 'conflict' : ''}`;
            div.setAttribute('data-value', item.value || 0);
            
            let badgeHTML = item.is_conflict_of_interest ? `<div class="item-conflict-badge" title="Posible Conflicto de Interés / Abuso de Poder">⚠️</div>` : '';
            let valueStr = item.value_str;
            div.innerHTML = `
                ${bgImageHTML}
                <div class="card-content-wrapper">
                    <div class="item-category">${item.category}</div>
                    <h2 class="item-title">${item.title}</h2>
                    <div class="item-value ${item.value < 0 ? 'negative-value' : ''}">${valueStr}</div>
                    ${badgeHTML}
                    <div class="item-content">${item.htmlContent || ''}</div>
                    ${sourcesHTML}
                </div>
            `;
        }
        container.appendChild(div);
    });

    setupScrollAnimations();
    drawCumulative();
}

function setupScrollAnimations() {
    ScrollTrigger.getAll().forEach(t => t.kill());

    const wrapper = document.querySelector('.horizontal-scroll-wrapper');
    const container = document.querySelector('.horizontal-container');
    
    let horizontalScrollTween = gsap.to(container, {
        x: () => -(container.scrollWidth - document.documentElement.clientWidth) + "px",
        ease: "none",
        scrollTrigger: {
            trigger: wrapper,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => "+=" + container.scrollWidth,
            invalidateOnRefresh: true
        }
    });

    const items = gsap.utils.toArray('.timeline-item, .historical-item, .timeline-gap');
    items.forEach((item) => {
        gsap.to(item, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: item,
                containerAnimation: horizontalScrollTween,
                start: "left center+=50%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

function drawCumulative() {
    const svg = document.getElementById('connection-line');
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    
    svg.innerHTML = `
      <defs>
        <linearGradient id="gradRed" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(212, 55, 55, 0.6);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0);stop-opacity:1" />
        </linearGradient>
        <linearGradient id="gradGold" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(212, 175, 55, 0.6);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0);stop-opacity:1" />
        </linearGradient>
      </defs>
    `; 
    
    const container = document.querySelector('.horizontal-container');
    const width = container.scrollWidth;
    const height = Math.min(window.innerHeight, document.documentElement.clientHeight);
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    const financialItems = document.querySelectorAll('.financial-item');
    if(financialItems.length === 0) return;

    let currentAccumulated = 0;
    let minAccumulated = 0;
    let maxAccumulated = 3800000000;
    
    financialItems.forEach((item) => {
        let value = parseInt(item.getAttribute('data-value'), 10);
        if (isNaN(value)) value = 0;
        const titleEl = item.querySelector('.item-title') || item.querySelector('.hist-title');
        if (titleEl && /(Total|Anual|Acumulada)/i.test(titleEl.innerText)) value = 0;
        
        currentAccumulated += value;
        if(currentAccumulated < minAccumulated) minAccumulated = currentAccumulated;
        if(currentAccumulated > maxAccumulated) maxAccumulated = currentAccumulated;
    });

    const range = maxAccumulated - minAccumulated;
    function getY(val) {
        if (range === 0) return height / 2;
        const pct = (val - minAccumulated) / range;
        return height * 0.85 - (pct * height * 0.7);
    }

    let pathDataRed = `M -100 ${height} `;
    let pathDataGold = ``;
    currentAccumulated = 0;
    let inProsperity = false;
    let transitionX = 0;
    let lastY = height;
    let lastX = 0;
    
    // Calculate absolute maximum value for thickness normalization
    let maxTransaction = 0;
    financialItems.forEach((item) => {
        let val = Math.abs(parseInt(item.getAttribute('data-value'), 10) || 0);
        if (val > maxTransaction) maxTransaction = val;
    });
    if (maxTransaction === 0) maxTransaction = 1;
    
    if (minAccumulated < 0) {
        const zeroY = getY(0);
        const zeroLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        zeroLine.setAttribute("x1", 0);
        zeroLine.setAttribute("y1", zeroY);
        zeroLine.setAttribute("x2", width + 500);
        zeroLine.setAttribute("y2", zeroY);
        zeroLine.setAttribute("stroke", "rgba(255,255,255,0.1)");
        zeroLine.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(zeroLine);
    }

    const axisBottomY = height - 40; 
    const mainAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    mainAxis.setAttribute("x1", 0);
    mainAxis.setAttribute("y1", axisBottomY);
    mainAxis.setAttribute("x2", width + 500);
    mainAxis.setAttribute("y2", axisBottomY);
    mainAxis.setAttribute("stroke", "rgba(255,255,255,0.2)");
    mainAxis.setAttribute("stroke-width", "2");
    svg.appendChild(mainAxis);
    
    financialItems.forEach((item, index) => {
        const x = item.offsetLeft + item.offsetWidth / 2;
        const dateStr = item.getAttribute('data-date') || '';
        
        let value = parseInt(item.getAttribute('data-value'), 10);
        if (isNaN(value)) value = 0;
        
        const titleEl = item.querySelector('.item-title') || item.querySelector('.hist-title');
        if (titleEl && /(Total|Anual|Acumulada)/i.test(titleEl.innerText)) value = 0;
        
        currentAccumulated += value;
        let y = getY(currentAccumulated);
        if (isNaN(y) || y > 20000 || y < -20000) y = height;
        
        // Handle transition splitting
        if (!inProsperity && dateStr >= '2016-11-08') {
            inProsperity = true;
            transitionX = x - 250; // offset line just before the election card
            
            // Close red path
            pathDataRed += `L ${transitionX} ${lastY} L ${transitionX} ${height} Z`;
            
            // Draw vertical split line
            const splitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            splitLine.setAttribute("x1", transitionX);
            splitLine.setAttribute("y1", 0);
            splitLine.setAttribute("x2", transitionX);
            splitLine.setAttribute("y2", height);
            splitLine.setAttribute("stroke", "#fff");
            splitLine.setAttribute("stroke-dasharray", "10,10");
            splitLine.setAttribute("stroke-width", "2");
            splitLine.setAttribute("opacity", "0.5");
            svg.appendChild(splitLine);
            
            // Start gold path
            pathDataGold = `M ${transitionX} ${height} L ${transitionX} ${lastY} `;
            lastX = transitionX;
        }

        // Calculate dynamic thickness for the line stroke connecting lastX,lastY to x,y
        let thickness = 4 + (Math.abs(value) / maxTransaction) * 26;
        if (thickness > 30) thickness = 30;
        
        if (index === 0) {
            lastX = 0;
            if (!inProsperity) pathDataRed += `L 0 ${y} `;
        }

        // Draw independent thick semi-transparent line segment
        const lineSegment = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineSegment.setAttribute("x1", lastX);
        lineSegment.setAttribute("y1", lastY === height && index===0 ? y : lastY);
        lineSegment.setAttribute("x2", x);
        lineSegment.setAttribute("y2", y);
        lineSegment.setAttribute("stroke", inProsperity ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 55, 55, 0.4)");
        lineSegment.setAttribute("stroke-width", thickness);
        lineSegment.setAttribute("stroke-linecap", "round");
        svg.appendChild(lineSegment);
        
        if (!inProsperity) {
            pathDataRed += `L ${x} ${y} `;
        } else {
            pathDataGold += `L ${x} ${y} `;
        }
        
        lastY = y;
        lastX = x;
        
        // Vertical connector downwards to axis
        const verticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        verticalLine.setAttribute("x1", x);
        verticalLine.setAttribute("y1", y);
        verticalLine.setAttribute("x2", x);
        verticalLine.setAttribute("y2", axisBottomY);
        verticalLine.setAttribute("stroke", inProsperity ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 55, 55, 0.4)");
        verticalLine.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(verticalLine);

        // Data node circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "6");
        circle.setAttribute("fill", "#f0f4f8");
        circle.setAttribute("stroke", inProsperity ? "#d4af37" : "#d43737");
        circle.setAttribute("stroke-width", "3");
        svg.appendChild(circle);
        
        // Cumulative Text Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", currentAccumulated < 0 ? y + 30 : y - 20);
        text.setAttribute("class", "cumulative-label" + (currentAccumulated < 0 ? " negative-label" : ""));
        text.setAttribute("text-anchor", "middle");
        text.textContent = `${currentAccumulated < 0 ? '-' : ''}$${Math.abs(currentAccumulated / 1e9).toFixed(2)}B`;
        svg.appendChild(text);

        // Bottom axis amount text (secondary cumulative indicator)
        const amountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        amountText.setAttribute("x", x);
        amountText.setAttribute("y", axisBottomY - 10);
        amountText.setAttribute("class", "axis-svg-amount");
        amountText.setAttribute("text-anchor", "middle");
        amountText.setAttribute("fill", inProsperity ? "#d4af37" : "#d43737");
        amountText.textContent = `${currentAccumulated < 0 ? '-' : ''}$${Math.abs(currentAccumulated / 1e9).toFixed(2)}B`;
        svg.appendChild(amountText);

        // Bottom axis date text
        const dateD = new Date(dateStr);
        const formatter = new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' });
        const labelStr = dateStr ? formatter.format(dateD).toUpperCase() : '';
        
        const axisText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        axisText.setAttribute("x", x);
        axisText.setAttribute("y", axisBottomY + 25);
        axisText.setAttribute("class", "axis-svg-label");
        axisText.setAttribute("text-anchor", "middle");
        axisText.setAttribute("fill", "#ffffff"); // Make the date white for contrast against the colored amount
        axisText.textContent = labelStr;
        svg.appendChild(axisText);
    });
    
    const endX = width + 500;
    // Close Gold Path if it exists, otherwise close Red
    if (inProsperity) {
        pathDataGold += `L ${endX} ${lastY} L ${endX} ${height} Z`;
    } else {
        pathDataRed += `L ${endX} ${lastY} L ${endX} ${height} Z`;
    }

    const pathRed = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRed.setAttribute("d", pathDataRed);
    pathRed.setAttribute("class", "cumulative-path red-path");
    svg.insertBefore(pathRed, svg.firstChild);

    if (inProsperity) {
        const pathGold = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathGold.setAttribute("d", pathDataGold);
        pathGold.setAttribute("class", "cumulative-path gold-path");
        svg.insertBefore(pathGold, svg.childNodes[1]);
    }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterValue = e.target.getAttribute('data-filter');
        
        // Instead of destructive filtering, we travel to the first matching item horizontally
        if(filterValue === 'all') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Find first data element matching this category
        const firstMatchIndex = allData.findIndex(d => d.category && d.category.includes(filterValue));
        if (firstMatchIndex !== -1) {
            const itemId = allData[firstMatchIndex].id;
            const domElement = document.getElementById(itemId);
            if (domElement) {
                // Calculate vertical scroll equivalent for horizontal position
                // Hero height is window.innerHeight. ScrollTrigger pins for scrollWidth.
                const targetX = domElement.offsetLeft;
                const scrollTarget = window.innerHeight + targetX - (window.innerWidth / 2) + 200;
                window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            }
        }
    });
});

window.addEventListener('resize', () => {
    drawCumulative();
});

document.addEventListener('DOMContentLoaded', loadData);
