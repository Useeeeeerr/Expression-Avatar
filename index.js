import { getContext, extension_settings, getApiUrl, saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../events.js";
import { dragElement } from "../../../../utils.js";

// 확장 프로그램 이름
const extensionName = 'expression_avatar';

// 기본 설정값
const defaultSettings = {
    enabled: false,
    keepOriginalAvatar: true,
    originalAvatarOpacity: 0.5,
    avatarHeight: 160,
    applyToUser: false,
    mobileSupport: true,
    enabledExpressions: {
        happy: true,
        sad: true,
        angry: true,
        surprised: true,
        neutral: true
    },
    expressionKeywords: {
        happy: ['happy', 'joy', 'smile', 'laugh', 'grin', 'excited'],
        sad: ['sad', 'cry', 'tears', 'depressed', 'unhappy', 'disappointed'],
        angry: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage'],
        surprised: ['surprised', 'shocked', 'astonished', 'amazed', 'startled'],
        neutral: ['neutral', 'calm', 'normal', 'blank', 'expressionless']
    }
};

// 현재 활성화된 표정 맵
let activeExpressionMap = new Map();

/**
 * 확장 프로그램 설정 UI HTML 생성 함수
 */
function getSettings() {
    return `
        <div class="expression_avatar_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>표정 아바타 모드</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="expression_avatar_flex_container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="expression_avatar_enabled">
                            <span>활성화</span>
                        </label>
                    </div>
                    
                    <div class="expression_avatar_flex_container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="expression_avatar_keep_original">
                            <span>원본 아바타 유지</span>
                        </label>
                    </div>
                    
                    <div class="expression_avatar_setting_block">
                        <label for="expression_avatar_opacity">원본 아바타 투명도:</label>
                        <input type="range" id="expression_avatar_opacity" min="0" max="1" step="0.1" value="0.5">
                        <span id="expression_avatar_opacity_value">0.5</span>
                    </div>
                    
                    <div class="expression_avatar_setting_block">
                        <label for="expression_avatar_height">아바타 높이 (px):</label>
                        <input type="number" id="expression_avatar_height" min="40" max="500" value="160">
                    </div>
                    
                    <div class="expression_avatar_flex_container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="expression_avatar_apply_to_user">
                            <span>사용자 메시지에도 적용</span>
                        </label>
                    </div>
                    
                    <div class="expression_avatar_flex_container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="expression_avatar_mobile_support">
                            <span>모바일 지원</span>
                        </label>
                    </div>
                    
                    <div class="expression_avatar_expressions">
                        <h4>활성화할 표정</h4>
                        <div class="expression_avatar_expressions_grid">
                            <label class="checkbox_label">
                                <input type="checkbox" id="expression_avatar_enable_happy" checked>
                                <span>기쁨</span>
                            </label>
                            <label class="checkbox_label">
                                <input type="checkbox" id="expression_avatar_enable_sad" checked>
                                <span>슬픔</span>
                            </label>
                            <label class="checkbox_label">
                                <input type="checkbox" id="expression_avatar_enable_angry" checked>
                                <span>화남</span>
                            </label>
                            <label class="checkbox_label">
                                <input type="checkbox" id="expression_avatar_enable_surprised" checked>
                                <span>놀람</span>
                            </label>
                            <label class="checkbox_label">
                                <input type="checkbox" id="expression_avatar_enable_neutral" checked>
                                <span>중립</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="expression_avatar_keywords">
                        <h4>표정 키워드 설정</h4>
                        <div class="expression_avatar_keyword_block">
                            <label>기쁨 키워드 (쉼표로 구분):</label>
                            <textarea id="expression_avatar_happy_keywords" rows="2"></textarea>
                        </div>
                        <div class="expression_avatar_keyword_block">
                            <label>슬픔 키워드 (쉼표로 구분):</label>
                            <textarea id="expression_avatar_sad_keywords" rows="2"></textarea>
                        </div>
                        <div class="expression_avatar_keyword_block">
                            <label>화남 키워드 (쉼표로 구분):</label>
                            <textarea id="expression_avatar_angry_keywords" rows="2"></textarea>
                        </div>
                        <div class="expression_avatar_keyword_block">
                            <label>놀람 키워드 (쉼표로 구분):</label>
                            <textarea id="expression_avatar_surprised_keywords" rows="2"></textarea>
                        </div>
                        <div class="expression_avatar_keyword_block">
                            <label>중립 키워드 (쉼표로 구분):</label>
                            <textarea id="expression_avatar_neutral_keywords" rows="2"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 설정 값을 저장하는 함수
 */
function saveSettings() {
    // 기본 설정 저장
    extension_settings[extensionName].enabled = $('#expression_avatar_enabled').is(':checked');
    extension_settings[extensionName].keepOriginalAvatar = $('#expression_avatar_keep_original').is(':checked');
    extension_settings[extensionName].originalAvatarOpacity = parseFloat($('#expression_avatar_opacity').val());
    extension_settings[extensionName].avatarHeight = parseInt($('#expression_avatar_height').val());
    extension_settings[extensionName].applyToUser = $('#expression_avatar_apply_to_user').is(':checked');
    extension_settings[extensionName].mobileSupport = $('#expression_avatar_mobile_support').is(':checked');
    
    // 활성화된 표정 저장
    extension_settings[extensionName].enabledExpressions = {
        happy: $('#expression_avatar_enable_happy').is(':checked'),
        sad: $('#expression_avatar_enable_sad').is(':checked'),
        angry: $('#expression_avatar_enable_angry').is(':checked'),
        surprised: $('#expression_avatar_enable_surprised').is(':checked'),
        neutral: $('#expression_avatar_enable_neutral').is(':checked')
    };
    
    // 표정 키워드 저장
    extension_settings[extensionName].expressionKeywords = {
        happy: $('#expression_avatar_happy_keywords').val().split(',').map(k => k.trim()).filter(k => k),
        sad: $('#expression_avatar_sad_keywords').val().split(',').map(k => k.trim()).filter(k => k),
        angry: $('#expression_avatar_angry_keywords').val().split(',').map(k => k.trim()).filter(k => k),
        surprised: $('#expression_avatar_surprised_keywords').val().split(',').map(k => k.trim()).filter(k => k),
        neutral: $('#expression_avatar_neutral_keywords').val().split(',').map(k => k.trim()).filter(k => k)
    };
    
    saveSettingsDebounced();
}

/**
 * 설정 UI를 초기화하는 함수
 */
function initSettings() {
    // 기본 설정 적용
    $('#expression_avatar_enabled').prop('checked', extension_settings[extensionName].enabled);
    $('#expression_avatar_keep_original').prop('checked', extension_settings[extensionName].keepOriginalAvatar);
    $('#expression_avatar_opacity').val(extension_settings[extensionName].originalAvatarOpacity);
    $('#expression_avatar_opacity_value').text(extension_settings[extensionName].originalAvatarOpacity);
    $('#expression_avatar_height').val(extension_settings[extensionName].avatarHeight);
    $('#expression_avatar_apply_to_user').prop('checked', extension_settings[extensionName].applyToUser);
    $('#expression_avatar_mobile_support').prop('checked', extension_settings[extensionName].mobileSupport);
    
    // 활성화된 표정 설정
    $('#expression_avatar_enable_happy').prop('checked', extension_settings[extensionName].enabledExpressions.happy);
    $('#expression_avatar_enable_sad').prop('checked', extension_settings[extensionName].enabledExpressions.sad);
    $('#expression_avatar_enable_angry').prop('checked', extension_settings[extensionName].enabledExpressions.angry);
    $('#expression_avatar_enable_surprised').prop('checked', extension_settings[extensionName].enabledExpressions.surprised);
    $('#expression_avatar_enable_neutral').prop('checked', extension_settings[extensionName].enabledExpressions.neutral);
    
    // 표정 키워드 설정
    $('#expression_avatar_happy_keywords').val(extension_settings[extensionName].expressionKeywords.happy.join(', '));
    $('#expression_avatar_sad_keywords').val(extension_settings[extensionName].expressionKeywords.sad.join(', '));
    $('#expression_avatar_angry_keywords').val(extension_settings[extensionName].expressionKeywords.angry.join(', '));
    $('#expression_avatar_surprised_keywords').val(extension_settings[extensionName].expressionKeywords.surprised.join(', '));
    $('#expression_avatar_neutral_keywords').val(extension_settings[extensionName].expressionKeywords.neutral.join(', '));
    
    // 이벤트 리스너 등록
    $('#expression_avatar_enabled').on('change', saveSettings);
    $('#expression_avatar_keep_original').on('change', saveSettings);
    $('#expression_avatar_opacity').on('input', function() {
        $('#expression_avatar_opacity_value').text($(this).val());
        saveSettings();
    });
    $('#expression_avatar_height').on('input', saveSettings);
    $('#expression_avatar_apply_to_user').on('change', saveSettings);
    $('#expression_avatar_mobile_support').on('change', saveSettings);
    
    // 표정 활성화 변경 이벤트
    $('.expression_avatar_expressions input[type="checkbox"]').on('change', saveSettings);
    
    // 키워드 변경 이벤트
    $('.expression_avatar_keyword_block textarea').on('change', saveSettings);
    
    // 드로어 토글 이벤트
    $('.inline-drawer-toggle').on('click', function() {
        $(this).next('.inline-drawer-content').toggle();
        $(this).find('.inline-drawer-icon').toggleClass('down');
    });
}

/**
 * 메시지에서 표정을 감지하는 함수
 */
function detectExpression(message) {
    if (!message) return 'neutral';
    
    const messageLower = message.toLowerCase();
    const expressions = extension_settings[extensionName].enabledExpressions;
    const keywords = extension_settings[extensionName].expressionKeywords;
    
    // 각 표정 키워드 검사
    if (expressions.happy && keywords.happy.some(keyword => messageLower.includes(keyword))) {
        return 'happy';
    }
    if (expressions.sad && keywords.sad.some(keyword => messageLower.includes(keyword))) {
        return 'sad';
    }
    if (expressions.angry && keywords.angry.some(keyword => messageLower.includes(keyword))) {
        return 'angry';
    }
    if (expressions.surprised && keywords.surprised.some(keyword => messageLower.includes(keyword))) {
        return 'surprised';
    }
    if (expressions.neutral && keywords.neutral.some(keyword => messageLower.includes(keyword))) {
        return 'neutral';
    }
    
    return 'neutral'; // 기본 표정
}

/**
 * 메시지의 아바타를 표정 아바타로 교체하는 함수
 */
function applyExpressionAvatar(messageElement, expressionType, isUser = false) {
    if (!extension_settings[extensionName].enabled) return;
    
    // 사용자 메시지인데 사용자 메시지 적용 옵션이 꺼져있으면 무시
    if (isUser && !extension_settings[extensionName].applyToUser) return;
    
    const avatarImg = messageElement.find('.avatar img');
    if (avatarImg.length === 0) return;
    
    // 이미 적용된 표정 아바타 요소가 있는지 확인
    let expressionAvatarElement = messageElement.find('.expression_avatar_container');
    
    // 아바타 원본 URL 가져오기
    const originalSrc = avatarImg.attr('src');
    
    // 표정 아바타 이미지 URL 생성 (예: happy.png, sad.png 등)
    // 이 부분은 실제 구현에 맞게 수정해야 함
    const expressionImageUrl = `extensions/expression_avatar/images/${expressionType}.png`;
    
    if (expressionAvatarElement.length === 0) {
        // 표정 아바타 컨테이너 생성
        expressionAvatarElement = $('<div class="expression_avatar_container"></div>');
        
        // 컨테이너 스타일 설정
        expressionAvatarElement.css({
            'position': 'absolute',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': '2'
        });
        
        // 표정 아바타 이미지 요소 생성
        const expressionAvatarImg = $(`<img src="${expressionImageUrl}" alt="${expressionType}" class="expression_avatar">`);
        
        // 이미지 스타일 설정
        expressionAvatarImg.css({
            'max-height': `${extension_settings[extensionName].avatarHeight}px`,
            'max-width': '100%',
            'object-fit': 'contain'
        });
        
        // 컨테이너에 이미지 추가
        expressionAvatarElement.append(expressionAvatarImg);
        
        // 아바타 컨테이너에 표정 아바타 추가
        avatarImg.parent().append(expressionAvatarElement);
        
        // 원본 아바타 투명도 설정
        if (extension_settings[extensionName].keepOriginalAvatar) {
            avatarImg.css('opacity', extension_settings[extensionName].originalAvatarOpacity);
        } else {
            avatarImg.css('opacity', '0');
        }
    } else {
        // 기존 표정 이미지 업데이트
        expressionAvatarElement.find('.expression_avatar').attr('src', expressionImageUrl);
    }
    
    // 활성화된 표정 맵에 저장
    activeExpressionMap.set(messageElement.attr('mesid'), expressionType);
}

/**
 * 메시지 표시 이벤트 핸들러
 */
function onMessageDisplayed(data) {
    if (!extension_settings[extensionName].enabled) return;
    
    const messageElement = data.messageEl;
    if (!messageElement) return;
    
    // 메시지 ID 확인
    const messageId = messageElement.attr('mesid');
    if (!messageId) return;
    
    // 메시지가 사용자 메시지인지 확인
    const isUserMessage = messageElement.hasClass('user');
    
    // 사용자 메시지이고 사용자 메시지 적용 옵션이 꺼져있으면 무시
    if (isUserMessage && !extension_settings[extensionName].applyToUser) return;
    
    // 메시지 텍스트 추출
    const messageText = messageElement.find('.mes_text').text();
    
    // 표정 감지
    const expressionType = detectExpression(messageText);
    
    // 표정 아바타 적용
    applyExpressionAvatar(messageElement, expressionType, isUserMessage);
}

/**
 * 메시지 편집 이벤트 핸들러 
 */
function onMessageEdited(data) {
    if (!extension_settings[extensionName].enabled) return;
    
    const messageId = data.id;
    if (!messageId) return;
    
    // 메시지 요소 찾기
    const messageElement = $(`.mes[mesid="${messageId}"]`);
    if (messageElement.length === 0) return;
    
    // 메시지가 사용자 메시지인지 확인
    const isUserMessage = messageElement.hasClass('user');
    
    // 사용자 메시지이고 사용자 메시지 적용 옵션이 꺼져있으면 무시
    if (isUserMessage && !extension_settings[extensionName].applyToUser) return;
    
    // 편집된 메시지 텍스트 추출
    const messageText = messageElement.find('.mes_text').text();
    
    // 표정 감지
    const expressionType = detectExpression(messageText);
    
    // 표정 아바타 적용
    applyExpressionAvatar(messageElement, expressionType, isUserMessage);
}

/**
 * 채팅 업데이트 이벤트 핸들러
 */
function onChatUpdated() {
    if (!extension_settings[extensionName].enabled) return;
    
    // 모든 메시지 요소에 대해 처리
    $('.mes').each(function() {
        const messageElement = $(this);
        const messageId = messageElement.attr('mesid');
        if (!messageId) return;
        
        // 메시지가 사용자 메시지인지 확인
        const isUserMessage = messageElement.hasClass('user');
        
        // 사용자 메시지이고 사용자 메시지 적용 옵션이 꺼져있으면 무시
        if (isUserMessage && !extension_settings[extensionName].applyToUser) return;
        
        // 메시지 텍스트 추출
        const messageText = messageElement.find('.mes_text').text();
        
        // 표정 감지
        const expressionType = detectExpression(messageText);
        
        // 표정 아바타 적용
        applyExpressionAvatar(messageElement, expressionType, isUserMessage);
    });
}

/**
 * 확장 프로그램 초기화 함수
 */
function initExpressionAvatar() {
    // 설정 초기화
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }
    
    // 기본 설정 적용
    for (const key in defaultSettings) {
        if (extension_settings[extensionName][key] === undefined) {
            if (typeof defaultSettings[key] === 'object' && defaultSettings[key] !== null) {
                extension_settings[extensionName][key] = JSON.parse(JSON.stringify(defaultSettings[key]));
            } else {
                extension_settings[extensionName][key] = defaultSettings[key];
            }
        }
    }
    
    // 키워드 객체가 없거나 빈 경우 기본값 설정
    if (!extension_settings[extensionName].expressionKeywords || Object.keys(extension_settings[extensionName].expressionKeywords).length === 0) {
        extension_settings[extensionName].expressionKeywords = JSON.parse(JSON.stringify(defaultSettings.expressionKeywords));
    }
    
    // 설정 UI 로드
    const settingsHtml = getSettings();
    $('#extensions_settings').append(settingsHtml);
    
    // 설정 초기화
    initSettings();
    
    // 이벤트 리스너 등록
    eventSource.on(event_types.MESSAGE_RENDERED, onMessageDisplayed);
    eventSource.on(event_types.MESSAGE_EDITED, onMessageEdited);
    eventSource.on(event_types.CHAT_CHANGED, onChatUpdated);
}

// 확장 프로그램 등록 및 초기화
jQuery(async () => {
    // 확장 프로그램 등록
    const extensionInfo = {
        name: extensionName,
        title: '표정 아바타',
        settings: defaultSettings,
    };
    
    try {
        await registerExtension(extensionInfo);
        initExpressionAvatar();
        console.log('Expression Avatar 확장 프로그램이 성공적으로 로드되었습니다.');
    } catch (error) {
        console.error('Expression Avatar 확장 프로그램 로드 실패:', error);
    }
});

// CSS 스타일 추가
const expressionAvatarStyles = `
.expression_avatar_settings {
    margin-bottom: 20px;
}

.expression_avatar_flex_container {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.expression_avatar_setting_block {
    margin-bottom: 15px;
}

.expression_avatar_setting_block label {
    display: block;
    margin-bottom: 5px;
}

.expression_avatar_expressions {
    margin-top: 20px;
}

.expression_avatar_expressions_grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 10px;
}

.expression_avatar_keywords {
    margin-top: 20px;
}

.expression_avatar_keyword_block {
    margin-bottom: 15px;
}

.expression_avatar_keyword_block label {
    display: block;
    margin-bottom: 5px;
}

.expression_avatar_keyword_block textarea {
    width: 100%;
    resize: vertical;
}
`;

// 스타일 태그 추가
jQuery('head').append(`<style>${expressionAvatarStyles}</style>`);
