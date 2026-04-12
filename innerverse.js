/**
 * innerverse.js
 * 使用方法：在 copy2 的 </body> 前加一行：
 *   <script src="innerverse.js"></script>
 * 然后把 Innerverse 图标的 onclick 改为：
 *   onclick="openInnerverseApp()"
 *
 * 完全复用 copy2 的：window.ib / closeApp() / .ios-app-window / 状态栏 / 字体
 */

(function () {

    /* ══════════════════════════════════════════
       1. 注入 CSS（只注入一次）
    ══════════════════════════════════════════ */
    if (!document.getElementById('_iv_style')) {
        const s = document.createElement('style');
        s.id = '_iv_style';
        s.textContent = `
        /* ── 整体容器：复用 ios-app-window，只补背景色 ── */
        #innerverseApp {
            background: #080b12;
            overflow: hidden;
        }

        /* ── 星空背景 ── */
        #_iv_starfield {
            position: absolute; inset: 0;
            pointer-events: none; overflow: hidden; z-index: 0;
        }
        ._iv_star {
            position: absolute; border-radius: 50%; background: #fff;
            animation: _iv_twinkle var(--dur,3s) ease-in-out infinite;
            animation-delay: var(--delay,0s);
        }
        @keyframes _iv_twinkle {
            0%,100% { opacity: var(--o1,.15); }
            50%      { opacity: var(--o2,.8); }
        }
        ._iv_nebula {
            position: absolute; border-radius: 50%;
            pointer-events: none; filter: blur(70px);
        }
        ._iv_nebula.a {
            width:320px; height:320px;
            background: rgba(167,139,250,.22);
            top:-80px; left:-60px;
            animation: _iv_drift 18s ease-in-out infinite alternate;
        }
        ._iv_nebula.b {
            width:260px; height:260px;
            background: rgba(103,232,249,.18);
            bottom:60px; right:-70px;
            animation: _iv_drift 22s ease-in-out infinite alternate-reverse;
        }
        @keyframes _iv_drift {
            from { transform: translate(0,0) scale(1); }
            to   { transform: translate(28px,18px) scale(1.12); }
        }

        /* ── 顶部 Hero 导航区 ── */
        #_iv_nav {
            position: relative; z-index: 10;
            margin-top: 48px;
            padding: 28px 20px 24px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
        }

        /* 返回按钮：左上角绝对定位 */
        #_iv_back {
            position: absolute; top: 16px; left: 16px;
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(255,255,255,.07);
            border: 1px solid rgba(255,255,255,.12);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: background .18s, transform .25s cubic-bezier(.34,1.56,.64,1);
        }
        #_iv_back:active {
            background: rgba(255,255,255,.16);
            transform: scale(.88);
        }

        /* 角色数量：右上角绝对定位 */
        #_iv_total {
            position: absolute; top: 20px; right: 18px;
            font-size: 10px; letter-spacing: 1.5px; font-weight: 700;
            color: rgba(255,255,255,.2); text-transform: uppercase;
        }

        /* 装饰光晕环 */
        #_iv_nav_ring {
            width: 72px; height: 72px;
            border-radius: 50%;
            border: 1px solid rgba(167,139,250,.25);
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 16px;
            position: relative;
            animation: _iv_ring_spin 14s linear infinite;
        }
        #_iv_nav_ring::before {
            content: '';
            position: absolute; inset: 6px; border-radius: 50%;
            border: 1px solid rgba(103,232,249,.18);
            animation: _iv_ring_spin 9s linear infinite reverse;
        }
        #_iv_nav_ring::after {
            content: '';
            position: absolute; inset: 14px; border-radius: 50%;
            background: radial-gradient(circle, rgba(167,139,250,.3), transparent 70%);
        }
        @keyframes _iv_ring_spin {
            to { transform: rotate(360deg); }
        }

        /* 环中心点 */
        ._iv_ring_core {
            width: 10px; height: 10px; border-radius: 50%;
            background: linear-gradient(135deg, #a78bfa, #67e8f9);
            box-shadow: 0 0 16px rgba(167,139,250,.7), 0 0 30px rgba(103,232,249,.3);
            animation: _iv_core_pulse 2.8s ease-in-out infinite;
            z-index: 1;
        }
        @keyframes _iv_core_pulse {
            0%,100% { transform: scale(1); box-shadow: 0 0 16px rgba(167,139,250,.7); }
            50%      { transform: scale(1.35); box-shadow: 0 0 28px rgba(167,139,250,.9), 0 0 50px rgba(103,232,249,.4); }
        }

        /* 副标题 */
        ._iv_nav_sub {
            font-size: 9px; letter-spacing: 3.5px;
            color: #a78bfa; font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 6px;
            opacity: 0;
            animation: _iv_fade_up .7s .1s ease forwards;
        }

        /* 主标题 */
        ._iv_nav_title {
            font-size: 30px; font-weight: 900;
            letter-spacing: 2px;
            text-align: center;
            background: linear-gradient(135deg, #fff 30%, #a78bfa 70%, #67e8f9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.1;
            margin-bottom: 8px;
            opacity: 0;
            animation: _iv_fade_up .7s .22s ease forwards;
        }

        /* 描述文字 */
        ._iv_nav_desc {
            font-size: 11px; color: rgba(255,255,255,.35);
            letter-spacing: 1px; text-align: center;
            line-height: 1.6;
            opacity: 0;
            animation: _iv_fade_up .7s .34s ease forwards;
        }

        /* 底部分割线（渐隐效果） */
        ._iv_nav_line {
            width: 100%; height: 1px; margin-top: 22px;
            background: linear-gradient(90deg,
                transparent 0%, rgba(167,139,250,.35) 30%,
                rgba(103,232,249,.35) 70%, transparent 100%);
            opacity: 0;
            animation: _iv_fade_up .7s .45s ease forwards;
        }

        @keyframes _iv_fade_up {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ── 筛选栏 ── */
        #_iv_filters {
            position: relative; z-index: 10;
            display: flex; gap: 8px;
            padding: 12px 16px 8px;
            overflow-x: auto; scrollbar-width: none;
            flex-shrink: 0;
        }
        #_iv_filters::-webkit-scrollbar { display: none; }
        ._iv_chip {
            flex-shrink: 0; white-space: nowrap;
            padding: 6px 14px; border-radius: 100px;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.04);
            font-size: 11px; font-weight: 600;
            color: rgba(255,255,255,.4);
            cursor: pointer; transition: all .2s;
            letter-spacing: .3px;
        }
        ._iv_chip._iv_active {
            background: rgba(167,139,250,.18);
            border-color: #a78bfa;
            color: #a78bfa;
            box-shadow: 0 0 12px rgba(167,139,250,.15);
        }
        ._iv_chip:active { transform: scale(.95); }

        /* ── 滚动区 ── */
        #_iv_scroll {
            flex: 1; overflow-y: auto;
            padding: 12px 14px 40px;
            position: relative; z-index: 5;
            scrollbar-width: none;
        }
        #_iv_scroll::-webkit-scrollbar { display: none; }

        ._iv_section_label {
            font-size: 10px; letter-spacing: 2px;
            text-transform: uppercase; font-weight: 700;
            color: rgba(255,255,255,.25);
            margin-bottom: 12px; padding: 0 2px;
        }

        /* ── 角色网格 ── */
        ._iv_grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 11px;
        }

        /* ── 角色卡片 ── */
        ._iv_card {
            position: relative; overflow: hidden;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,.07);
            background: rgba(255,255,255,.03);
            cursor: pointer;
            display: flex; flex-direction: column;
            transition: transform .35s cubic-bezier(.34,1.56,.64,1),
                        border-color .3s, box-shadow .3s;
            animation: _iv_card_in .55s ease both;
        }
        @keyframes _iv_card_in {
            from { opacity:0; transform: translateY(22px) scale(.94); }
            to   { opacity:1; transform: translateY(0) scale(1); }
        }
        ._iv_card:active {
            transform: scale(.95);
            border-color: rgba(167,139,250,.5);
            box-shadow: 0 0 24px rgba(167,139,250,.2);
        }

        /* 顶部光泽层 */
        ._iv_card::before {
            content:''; position:absolute; inset:0; border-radius:20px; z-index:2;
            background: linear-gradient(160deg,
                rgba(255,255,255,.08) 0%,
                transparent 45%);
            pointer-events:none;
        }

        /* 横幅 */
        ._iv_banner {
            height: 130px; position: relative; overflow: hidden;
            flex-shrink: 0;
            border-radius: 20px 20px 0 0;
        }
        ._iv_banner img {
            width:100%; height:100%; object-fit:cover;
            transition: transform .5s ease, opacity .3s;
            opacity: .75;
        }
        ._iv_card:active ._iv_banner img {
            opacity:.9; transform:scale(1.06);
        }
        ._iv_banner_default {
            width:100%; height:100%;
            position:absolute; inset:0;
        }

        /* 横幅底部渐变遮罩 */
        ._iv_banner::after {
            content:''; position:absolute; inset:0; z-index:1;
            background: linear-gradient(180deg,
                transparent 35%,
                rgba(8,11,18,.85) 100%);
            pointer-events:none;
        }

        /* 世界数量角标 */
        ._iv_wbadge {
            position:absolute; top:9px; right:9px; z-index:3;
            background: rgba(0,0,0,.5);
            border: 1px solid rgba(255,255,255,.12);
            backdrop-filter: blur(8px);
            border-radius:100px; padding:3px 9px;
            display:flex; align-items:center; gap:4px;
        }
        ._iv_wbadge span {
            font-size:10px; font-weight:700; color:#67e8f9;
            letter-spacing:.3px;
        }

        /* 头像：贴在横幅底部左侧，悬浮在分界线上 */
        ._iv_av_wrap {
            position:absolute; bottom:-20px; left:12px; z-index:3;
        }
        ._iv_av {
            width:46px; height:46px; border-radius:50%;
            border: 2px solid rgba(255,255,255,.2);
            object-fit:cover; background:#111;
            box-shadow: 0 4px 16px rgba(0,0,0,.6),
                        0 0 0 3px rgba(167,139,250,.15);
        }
        ._iv_av_ph {
            width:46px; height:46px; border-radius:50%;
            border: 2px solid rgba(255,255,255,.2);
            display:flex; align-items:center; justify-content:center;
            font-size:18px; font-weight:900;
            color:rgba(255,255,255,.9);
            box-shadow: 0 4px 16px rgba(0,0,0,.6),
                        0 0 0 3px rgba(167,139,250,.15);
        }

        /* 名字直接压在横幅底部（z-index在遮罩之上） */
        ._iv_name_overlay {
            position: absolute; bottom: 10px; left: 68px; right: 10px;
            z-index: 3;
            font-size: 14px; font-weight: 800;
            color: rgba(255,255,255,.95);
            letter-spacing: .4px;
            line-height: 1.2;
            text-shadow: 0 2px 8px rgba(0,0,0,.8);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* 卡片文字区 */
        ._iv_body {
            padding: 26px 12px 4px;
            display: flex; flex-direction: column; gap: 4px;
        }
        ._iv_name { display: none; }
        ._iv_desc {
            font-size: 10px; color: rgba(255,255,255,.35);
            line-height: 1.65; letter-spacing: .25px;
            display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden;
        }

        /* 底栏 */
        ._iv_card_footer {
            display: flex; align-items: center;
            justify-content: space-between;
            padding: 8px 12px 12px;
        }
        ._iv_tag {
            font-size: 9px; font-weight: 700; letter-spacing: 1px;
            text-transform: uppercase; padding: 4px 10px;
            border-radius: 100px;
            background: rgba(167,139,250,.12);
            border: 1px solid rgba(167,139,250,.22);
            color: #a78bfa;
            transition: background .2s, box-shadow .2s;
        }
        ._iv_card:active ._iv_tag {
            background: rgba(167,139,250,.22);
            box-shadow: 0 0 10px rgba(167,139,250,.25);
        }
        ._iv_arrow {
            width: 22px; height: 22px; border-radius: 50%;
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.12);
            display: flex; align-items: center; justify-content: center;
            transition: transform .25s cubic-bezier(.34,1.56,.64,1),
                        background .2s;
        }
        ._iv_card:active ._iv_arrow {
            transform: translateX(3px);
            background: rgba(167,139,250,.2);
        }

        /* ── 空状态 ── */
        ._iv_empty {
            grid-column: span 2;
            display:flex; flex-direction:column; align-items:center;
            padding:50px 20px; gap:12px; text-align:center;
        }
        ._iv_empty_icon {
            width:56px; height:56px; border-radius:50%;
            background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.08);
            display:flex; align-items:center; justify-content:center;
        }
        ._iv_empty_title {
            font-size:15px; font-weight:700;
            color:rgba(255,255,255,.7); letter-spacing:.5px;
        }
        ._iv_empty_sub {
            font-size:11px; color:rgba(255,255,255,.3);
            line-height:1.7; letter-spacing:.3px;
        }

        /* ── 加载中 ── */
        ._iv_loading {
            grid-column:span 2;
            display:flex; flex-direction:column; align-items:center;
            padding:50px 20px; gap:14px;
        }
        ._iv_ring {
            width:36px; height:36px; border-radius:50%;
            border:2px solid rgba(255,255,255,.1);
            border-top-color:#a78bfa;
            animation: _iv_spin 1s linear infinite;
        }
        @keyframes _iv_spin { to { transform:rotate(360deg); } }
        ._iv_loading_txt {
            font-size:10px; color:rgba(255,255,255,.3);
            letter-spacing:1.5px; text-transform:uppercase; font-weight:600;
        }

        /* ── 世界详情底部面板 ── */
        #_iv_sheet_wrap {
            position:absolute; inset:0; z-index:200;
            pointer-events:none;
        }
        #_iv_sheet_wrap._iv_open { pointer-events:all; }
        #_iv_sheet_bd {
            position:absolute; inset:0;
            background:rgba(0,0,0,.65);
            backdrop-filter:blur(8px);
            opacity:0; transition:opacity .35s;
        }
        #_iv_sheet_wrap._iv_open #_iv_sheet_bd { opacity:1; }
        #_iv_sheet {
            position:absolute; bottom:0; left:0; right:0;
            background: linear-gradient(180deg,#0f1525,#080b12);
            border:1px solid rgba(255,255,255,.08); border-bottom:none;
            border-radius:26px 26px 0 0;
            max-height:80vh;
            display:flex; flex-direction:column; overflow:hidden;
            transform:translateY(100%);
            transition:transform .42s cubic-bezier(.32,.72,0,1);
        }
        #_iv_sheet_wrap._iv_open #_iv_sheet { transform:translateY(0); }

        ._iv_sh_handle_area {
            padding:12px 18px 0;
            display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        ._iv_sh_handle {
            width:34px; height:4px; border-radius:2px;
            background:rgba(255,255,255,.18);
        }
        ._iv_sh_char_row {
            width:100%; display:flex; align-items:center; gap:12px;
        }
        ._iv_sh_av {
            width:46px; height:46px; border-radius:50%;
            object-fit:cover; border:2px solid rgba(255,255,255,.18);
            flex-shrink:0; background:#1a1a2e;
        }
        ._iv_sh_av_ph {
            width:46px; height:46px; border-radius:50%;
            border:2px solid rgba(255,255,255,.18);
            display:flex; align-items:center; justify-content:center;
            font-size:18px; font-weight:900; color:rgba(255,255,255,.9);
            flex-shrink:0;
        }
        ._iv_sh_info { flex:1; }
        ._iv_sh_name {
            font-size:17px; font-weight:700; color:rgba(255,255,255,.9);
        }
        ._iv_sh_sub {
            font-size:11px; color:#a78bfa; margin-top:2px;
            opacity:.75; letter-spacing:.5px;
        }
        ._iv_sh_close {
            width:30px; height:30px; border-radius:50%;
            background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.1);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; flex-shrink:0;
        }
        ._iv_sh_close:active { opacity:.5; }
        ._iv_sh_divider {
            height:1px; background:rgba(255,255,255,.07); margin:12px 0 0;
        }
        ._iv_sh_title_row {
            padding:12px 18px 6px;
            display:flex; align-items:center;
        }
        ._iv_sh_label {
            flex:1; font-size:10px; letter-spacing:2px;
            text-transform:uppercase; font-weight:700;
            color:rgba(255,255,255,.28);
        }
        ._iv_sh_count {
            font-size:12px; color:#67e8f9; font-weight:700;
        }
        ._iv_sh_scroll {
            flex:1; overflow-y:auto; padding:4px 14px 30px;
            scrollbar-width:none;
        }
        ._iv_sh_scroll::-webkit-scrollbar { display:none; }

        /* 世界条目 */
        ._iv_world_item {
            padding:14px; border-radius:14px;
            background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.07);
            margin-bottom:9px; cursor:pointer;
            transition:border-color .2s, background .2s;
        }
        ._iv_world_item:active {
            border-color:#a78bfa;
            background:rgba(167,139,250,.07);
        }
        ._iv_wi_header {
            display:flex; align-items:flex-start; gap:9px; margin-bottom:7px;
        }
        ._iv_wi_icon {
            width:30px; height:30px; border-radius:9px; flex-shrink:0;
            background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(103,232,249,.15));
            border:1px solid rgba(167,139,250,.2);
            display:flex; align-items:center; justify-content:center;
        }
        ._iv_wi_name {
            font-size:13px; font-weight:600;
            color:rgba(255,255,255,.85); margin-bottom:2px;
        }
        ._iv_wi_type {
            font-size:9px; font-weight:700; letter-spacing:1px;
            text-transform:uppercase; color:rgba(255,255,255,.28);
        }
        ._iv_wi_content {
            font-size:11px; color:rgba(255,255,255,.35);
            line-height:1.7; letter-spacing:.2px;
            display:-webkit-box; -webkit-line-clamp:3;
            -webkit-box-orient:vertical; overflow:hidden;
        }
        ._iv_world_empty {
            text-align:center; padding:30px 16px;
            color:rgba(255,255,255,.25); font-size:12px;
            line-height:1.9; letter-spacing:.5px;
        }
        `;
        document.head.appendChild(s);
    }

    /* ══════════════════════════════════════════
       2. 注入页面 DOM（只注入一次）
    ══════════════════════════════════════════ */
    if (!document.getElementById('innerverseApp')) {
        const div = document.createElement('div');
        div.id = 'innerverseApp';
        div.className = 'ios-app-window';   // 复用 copy2 的全屏窗口系统
        div.innerHTML = `
            <!-- 星空 -->
            <div id="_iv_starfield"></div>
            <div class="_iv_nebula a"></div>
            <div class="_iv_nebula b"></div>

            <!-- 顶部导航（紧接 copy2 状态栏 48px 之后） -->
            <div id="_iv_nav">
                <div id="_iv_back" onclick="closeApp('innerverseApp')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="rgba(255,255,255,.7)" stroke-width="2.8"
                         stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </div>
                <div id="_iv_total"></div>

                <div id="_iv_nav_ring">
                    <div class="_iv_ring_core"></div>
                </div>
                <div class="_iv_nav_sub">EXPLORE DIMENSION</div>
                <div class="_iv_nav_title">Innerverse</div>
                <div class="_iv_nav_desc">选择一个灵魂&nbsp;&nbsp;·&nbsp;&nbsp;踏入属于他的宇宙</div>
                <div class="_iv_nav_line"></div>
            </div>

            <!-- 筛选 -->
            <div id="_iv_filters">
                <div class="_iv_chip _iv_active" onclick="_ivFilter('all',this)">全部角色</div>
                <div class="_iv_chip" onclick="_ivFilter('bound',this)">有世界观</div>
                <div class="_iv_chip" onclick="_ivFilter('unbound',this)">待构建</div>
            </div>

            <!-- 内容滚动区 -->
            <div id="_iv_scroll">
                <div class="_iv_section_label" id="_iv_label">选择要进入的角色世界</div>
                <div class="_iv_grid" id="_iv_grid">
                    <div class="_iv_loading">
                        <div class="_iv_ring"></div>
                        <div class="_iv_loading_txt">加载中</div>
                    </div>
                </div>
            </div>

            <!-- 世界详情底部面板 -->
            <div id="_iv_sheet_wrap">
                <div id="_iv_sheet_bd" onclick="_ivCloseSheet()"></div>
                <div id="_iv_sheet">
                    <div class="_iv_sh_handle_area">
                        <div class="_iv_sh_handle"></div>
                        <div class="_iv_sh_char_row" id="_iv_sh_char_row"></div>
                    </div>
                    <div class="_iv_sh_divider"></div>
                    <div class="_iv_sh_title_row">
                        <div class="_iv_sh_label">绑定的世界书</div>
                        <div class="_iv_sh_count" id="_iv_sh_count"></div>
                    </div>
                    <div class="_iv_sh_scroll" id="_iv_sh_worlds"></div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    /* ══════════════════════════════════════════
       3. 星空生成
    ══════════════════════════════════════════ */
    (function buildStars() {
        const sf = document.getElementById('_iv_starfield');
        if (!sf || sf.childElementCount > 0) return;
        for (let i = 0; i < 100; i++) {
            const s = document.createElement('div');
            s.className = '_iv_star';
            const sz = (Math.random() * 1.8 + 0.4).toFixed(1);
            s.style.cssText = `
                width:${sz}px;height:${sz}px;
                left:${(Math.random()*100).toFixed(1)}%;
                top:${(Math.random()*100).toFixed(1)}%;
                --o1:${(Math.random()*.15+.04).toFixed(2)};
                --o2:${(Math.random()*.55+.25).toFixed(2)};
                --dur:${(Math.random()*4+2).toFixed(1)}s;
                --delay:-${(Math.random()*5).toFixed(1)}s;
            `;
            sf.appendChild(s);
        }
    })();

    /* ══════════════════════════════════════════
       4. 数据 & 状态
    ══════════════════════════════════════════ */
    const IV = { chars: [], worlds: [], filter: 'all' };

    const AV_GRADS = [
        'linear-gradient(135deg,#a78bfa,#818cf8)',
        'linear-gradient(135deg,#67e8f9,#38bdf8)',
        'linear-gradient(135deg,#fbbf24,#f472b6)',
        'linear-gradient(135deg,#34d399,#6ee7b7)',
        'linear-gradient(135deg,#f87171,#fb923c)',
        'linear-gradient(135deg,#c084fc,#a78bfa)',
    ];
    const BG_GRADS = [
        'linear-gradient(135deg,#1a0533,#0a1a3a)',
        'linear-gradient(135deg,#001a2c,#003a2c)',
        'linear-gradient(135deg,#1a0010,#2a0a40)',
        'linear-gradient(135deg,#0a1a00,#1a2a10)',
        'linear-gradient(135deg,#150030,#002040)',
        'linear-gradient(135deg,#300010,#100030)',
    ];

    /* ══════════════════════════════════════════
       5. 渲染
    ══════════════════════════════════════════ */
    function worldTypeOf(content) {
        if (!content) return '世界背景';
        if (/不准|必须|禁止|严禁|协议|规则/.test(content)) return '世界规约';
        if (/历史|传说|起源|文明|王朝/.test(content)) return '历史背景';
        if (/地图|地名|区域|城市|王国/.test(content)) return '地理设定';
        if (/魔法|修炼|能力|系统|等级/.test(content)) return '能力体系';
        return '世界观设定';
    }

    function avatarHTML(char, idx, cls) {
        const hasAv = char.avatar && char.avatar.startsWith('data:');
        const initial = (char.name || '?').charAt(0);
        const grad = AV_GRADS[idx % AV_GRADS.length];
        return hasAv
            ? `<img class="${cls}" src="${char.avatar}" loading="lazy">`
            : `<div class="${cls}_ph" style="background:${grad}">${initial}</div>`;
    }

    function renderGrid() {
        const grid = document.getElementById('_iv_grid');
        const label = document.getElementById('_iv_label');
        const total = document.getElementById('_iv_total');

        let list = IV.chars;
        if (IV.filter === 'bound')   list = IV.chars.filter(c => c.boundWorldIds?.length > 0);
        if (IV.filter === 'unbound') list = IV.chars.filter(c => !c.boundWorldIds?.length);

        total.textContent = IV.chars.length || '';
        label.textContent = `${list.length} 个角色宇宙`;

        if (list.length === 0) {
            grid.innerHTML = `
            <div class="_iv_empty">
                <div class="_iv_empty_icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <div class="_iv_empty_title">暂无角色</div>
                <div class="_iv_empty_sub">
                    ${IV.filter === 'bound'
                        ? '还没有角色绑定世界观\n在角色书中为他们添加世界设定'
                        : '还没有创建任何角色\n在联系人页面添加第一个角色'}
                </div>
            </div>`;
            return;
        }

        const GLOBE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#67e8f9" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
                     15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`;

        grid.innerHTML = list.map((char) => {
    const realIdx = IV.chars.indexOf(char);
    const wCount = (char.boundWorldIds || [])
        .filter(id => IV.worlds.find(w => String(w.id) === String(id))).length;
    const hasBanner = char.banner && char.banner.startsWith('data:');
    const delay = (realIdx * 0.07).toFixed(2);
    const grad = BG_GRADS[realIdx % BG_GRADS.length];
    const initial = (char.name || '?').charAt(0);
    const avGrad = AV_GRADS[realIdx % AV_GRADS.length];
    const hasAv = char.avatar && char.avatar.startsWith('data:');

    return `
    <div class="_iv_card" style="animation-delay:${delay}s" onclick="_ivOpenSheet(${realIdx})">

        <!-- 横幅区 -->
        <div class="_iv_banner" style="position:relative;height:110px;overflow:hidden;border-radius:16px 16px 0 0;">

            ${hasBanner
                ? `<img src="${char.banner}" loading="lazy" style="width:100%;height:100%;object-fit:cover;opacity:.7;transition:transform .5s ease,opacity .3s;">`
                : `<div style="width:100%;height:100%;background:${grad};position:absolute;inset:0;"></div>`}

            <!-- 底部渐变遮罩 -->
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(8,11,18,.9) 100%);pointer-events:none;"></div>

            <!-- 右上角世界数角标 -->
            <div style="position:absolute;top:10px;right:10px;z-index:3;
                        background:rgba(0,0,0,.45);backdrop-filter:blur(8px);
                        border:1px solid rgba(255,255,255,.13);border-radius:100px;
                        padding:3px 10px;display:flex;align-items:center;gap:5px;">
                ${wCount > 0
                    ? `<div style="width:5px;height:5px;border-radius:50%;background:#67e8f9;box-shadow:0 0 6px #67e8f9;flex-shrink:0;"></div>
                       <span style="font-size:10px;font-weight:700;color:#67e8f9;letter-spacing:.3px;">${wCount}</span>`
                    : `<span style="font-size:10px;font-weight:600;color:rgba(255,255,255,.25);letter-spacing:.3px;">—</span>`}
            </div>

            <!-- 左下头像 + 名字（压在遮罩上） -->
            <div style="position:absolute;bottom:10px;left:11px;right:11px;z-index:3;
                        display:flex;align-items:center;gap:9px;">
                ${hasAv
                    ? `<img src="${char.avatar}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.25);flex-shrink:0;">`
                    : `<div style="width:34px;height:34px;border-radius:50%;background:${avGrad};
                                  border:2px solid rgba(255,255,255,.2);flex-shrink:0;
                                  display:flex;align-items:center;justify-content:center;
                                  font-size:14px;font-weight:900;color:#fff;">${initial}</div>`}
                <div style="overflow:hidden;">
                    <div style="font-size:14px;font-weight:800;color:rgba(255,255,255,.95);
                                letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                                text-shadow:0 2px 8px rgba(0,0,0,.7);">${char.name || '未知角色'}</div>
                    <div style="font-size:9px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;
                                color:rgba(255,255,255,.35);margin-top:1px;">
                        ${wCount > 0 ? `${wCount} worlds` : 'unbound'}
                    </div>
                </div>
            </div>
        </div>

        <!-- 文字区 -->
        <div style="padding:11px 12px 6px;display:flex;flex-direction:column;gap:5px;">
            <div style="font-size:10px;color:rgba(255,255,255,.32);line-height:1.65;letter-spacing:.2px;
                        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${char.desc || char.bio || '这个角色还没有留下任何记录...'}
            </div>
        </div>

        <!-- 底栏 -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px 12px;">
            <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
                        padding:4px 10px;border-radius:100px;
                        ${wCount > 0
                            ? 'background:rgba(103,232,249,.1);border:1px solid rgba(103,232,249,.25);color:#67e8f9;'
                            : 'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.3);'}">
                ${wCount > 0 ? `${wCount} 个世界` : '待构建'}
            </div>
            <div style="width:24px;height:24px;border-radius:50%;
                        background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
                        display:flex;align-items:center;justify-content:center;">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                     stroke="rgba(255,255,255,.45)" stroke-width="2.8" stroke-linecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </div>
        </div>

    </div>`;
}).join('');
    }

    /* ══════════════════════════════════════════
       6. 底部面板：打开 / 关闭
    ══════════════════════════════════════════ */
    window._ivOpenSheet = function(idx) {
        const char = IV.chars[idx];
        if (!char) return;

        // 头像行
        document.getElementById('_iv_sh_char_row').innerHTML = `
            ${avatarHTML(char, idx, '_iv_sh_av')}
            <div class="_iv_sh_info">
                <div class="_iv_sh_name">${char.name || '未知角色'}</div>
                ${char.desc ? `<div class="_iv_sh_sub" style="font-size:10px;color:rgba(255,255,255,.3);margin-top:2px;letter-spacing:.3px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">${char.desc}</div>` : ''}
            </div>
            <div class="_iv_sh_close" onclick="_ivCloseSheet()">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                     stroke="rgba(255,255,255,.45)" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </div>`;

        // 世界列表
        const boundWorlds = (char.boundWorldIds || [])
            .map(id => IV.worlds.find(w => String(w.id) === String(id)))
            .filter(Boolean);

        document.getElementById('_iv_sh_count').textContent =
            boundWorlds.length ? `${boundWorlds.length} 条` : '';

        const ICON_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
                     15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`;

        document.getElementById('_iv_sh_worlds').innerHTML = boundWorlds.length === 0
            ? `<div class="_iv_world_empty">此角色的世界尚未展开<br>在角色书中为他绑定世界观<br>这里便会呈现他的宇宙</div>`
            : boundWorlds.map(w => `
                <div class="_iv_world_item">
                    <div class="_iv_wi_header">
                        <div class="_iv_wi_icon">${ICON_SVG}</div>
                        <div>
                            <div class="_iv_wi_name">${w.name || w.title || '无名世界'}</div>
                            <div class="_iv_wi_type">${worldTypeOf(w.content)}</div>
                        </div>
                    </div>
                    <div class="_iv_wi_content">${w.content || '暂无内容'}</div>
                </div>`).join('');

        document.getElementById('_iv_sheet_wrap').classList.add('_iv_open');
    };

    window._ivCloseSheet = function() {
        document.getElementById('_iv_sheet_wrap').classList.remove('_iv_open');
    };

    /* ══════════════════════════════════════════
       7. 筛选
    ══════════════════════════════════════════ */
    window._ivFilter = function(type, el) {
        IV.filter = type;
        document.querySelectorAll('._iv_chip').forEach(c => c.classList.remove('_iv_active'));
        el.classList.add('_iv_active');
        renderGrid();
    };

    /* ══════════════════════════════════════════
       8. 触摸下滑关闭面板
    ══════════════════════════════════════════ */
    (function() {
        let startY = 0;
        const wrap = document.getElementById('_iv_sheet_wrap');
        wrap.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
        wrap.addEventListener('touchend', e => {
            if (e.changedTouches[0].clientY - startY > 70) window._ivCloseSheet();
        }, { passive: true });
    })();

    /* ══════════════════════════════════════════
       9. 主入口：openInnerverseApp()
          直接复用 copy2 的 window.ib 和 openApp/closeApp
    ══════════════════════════════════════════ */
    window.openInnerverseApp = async function() {
        // 用 copy2 原生的 openApp 打开（动画、震动全部继承）
        if (typeof openApp === 'function') {
            // 手动执行打开动画（和 executeOpen 完全一样）
            const app = document.getElementById('innerverseApp');
            app.style.display = 'flex';
            void app.offsetWidth;
            app.classList.add('active');
            if (navigator.vibrate) navigator.vibrate(20);
        }

        // 读数据：直接用 copy2 的 window.ib，同一个 DB
        try {
            IV.chars  = await window.ib.getItem('char_list')  || [];
            IV.worlds = await window.ib.getItem('world_list') || [];
        } catch(e) {
            IV.chars  = JSON.parse(localStorage.getItem('char_list')  || '[]');
            IV.worlds = JSON.parse(localStorage.getItem('world_list') || '[]');
        }

        IV.filter = 'all';
        // 重置筛选按钮
        document.querySelectorAll('._iv_chip').forEach((c, i) => {
            c.classList.toggle('_iv_active', i === 0);
        });
        renderGrid();
    };

})();