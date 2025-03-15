/**
 * Expression-Avatar 확장 프로그램
 * SillyTavern의 expressions 확장과 연동하여 동작합니다.
 */

// 확장 프로그램 이름
const MODULE_NAME = 'expression_avatar';

// 기본 설정값
const DEFAULT_SETTINGS = {
    enabled: true,
    keepOriginalAvatar: true,
    originalAvatarOpacity: 0.5,
    avatarHeight: 160,
    applyToUser: false,
    mobileSupport: true
};

// 확장 초기화 함수
jQuery(document).ready(function() {
    // 설정 초기화
    if (!window.extension_settings) {
        window.extension_settings = {};
    }
    
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = Object.assign({}, DEFAULT_SETTINGS);
    }
    
    // 설정 UI 추가
    const settingsHtml = getSettings();
    $('#extensions_settings2').append(settingsHtml);
    
    // 설정 이벤트 및 UI 초기화
    initSettingsUI();
    
    // 이벤트 리스너 등록
    tryRegisterExpressionEvents();
    
    console.log(`${MODULE_NAME}: 확장이 초기화되었습니다.`);
});

/**
 * 설정 UI HTML 생성 함수
 */
function getSettings() {
    return `
        <div id="expression_avatar_settings">
            <div class="expression_avatar_header">
                <span>표정 아바타</span>
            </div>
            <div class="expression_avatar_block">
                <div class="expression_avatar_flex_container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="expression_avatar_enabled">
                        <span>표정 아바타 활성화</span>
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
                
                <div class="expression_avatar_note">
                    <p><i>참고: 이 확장은 SillyTavern의 expressions 확장과 연동하여 동작합니다.</i></p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 설정 UI 초기화 함수
 */
function initSettingsUI() {
    // 설정 값 UI에 적용
    $('#expression_avatar_enabled').prop('checked', extension_settings[MODULE_NAME].enabled);
    $('#expression_avatar_keep_original').prop('checked', extension_settings[MODULE_NAME].keepOriginalAvatar);
    $('#expression_avatar_opacity').val(extension_settings[MODULE_NAME].originalAvatarOpacity);
    $('#expression_avatar_opacity_value').text(extension_settings[MODULE_NAME].originalAvatarOpacity);
    $('#expression_avatar_height').val(extension_settings[MODULE_NAME].avatarHeight);
    $('#expression_avatar_apply_to_user').prop('checked', extension_settings[MODULE_NAME].applyToUser);
    $('#expression_avatar_mobile_support').prop('checked', extension_settings[MODULE_NAME].mobileSupport);
    
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
    
    // 드로어 헤더 클릭 이벤트 - SillyTavern 기본 기능 활용
    $('#expression_avatar_settings .expression_avatar_header').click(function() {
        $('#expression_avatar_settings .expression_avatar_block').toggle();
    });
}

/**
 * 설정 저장 함수
 */
function saveSettings() {
    extension_settings[MODULE_NAME].enabled = $('#expression_avatar_enabled').is(':checked');
    extension_settings[MODULE_NAME].keepOriginalAvatar = $('#expression_avatar_keep_original').is(':checked');
    extension_settings[MODULE_NAME].originalAvatarOpacity = parseFloat($('#expression_avatar_opacity').val());
    extension_settings[MODULE_NAME].avatarHeight = parseInt($('#expression_avatar_height').val());
    extension_settings[MODULE_NAME].applyToUser = $('#expression_avatar_apply_to_user').is(':checked');
    extension_settings[MODULE_NAME].mobileSupport = $('#expression_avatar_mobile_support').is(':checked');
    
    // SillyTavern의 설정 저장 함수 호출
    if (typeof saveSettingsDebounced === 'function') {
        saveSettingsDebounced();
    } else {
        console.warn(`${MODULE_NAME}: saveSettingsDebounced 함수를 찾을 수 없습니다.`);
    }
    
    console.log(`${MODULE_NAME}: 설정이 저장되었습니다.`);
}

/**
 * expressions 확장의 이벤트와 연동하기 위한 함수
 */
function tryRegisterExpressionEvents() {
    try {
        // SillyTavern의 eventSource 접근
        if (typeof eventSource === 'undefined') {
            console.warn(`${MODULE_NAME}: eventSource를 찾을 수 없습니다. 이벤트 등록이 지연됩니다.`);
            setTimeout(tryRegisterExpressionEvents, 1000);
            return;
        }
        
        // expressions 확장의 표정 감지 이벤트 리스닝
        eventSource.on('expression_updated', handleExpressionUpdate);
        
        // 메시지 렌더링 이벤트 리스닝
        if (typeof event_types !== 'undefined') {
            eventSource.on(event_types.MESSAGE_RENDERED, handleMessageRendered);
            eventSource.on(event_types.MESSAGE_EDITED, handleMessageEdited);
            console.log(`${MODULE_NAME}: 이벤트 리스너가 등록되었습니다.`);
        } else {
            console.warn(`${MODULE_NAME}: event_types를 찾을 수 없습니다.`);
        }
    } catch (error) {
        console.error(`${MODULE_NAME}: 이벤트 등록 중 오류가 발생했습니다.`, error);
    }
}

/**
 * 표정 업데이트 이벤트 핸들러
 */
function handleExpressionUpdate(data) {
    if (!extension_settings[MODULE_NAME].enabled) return;
    
    try {
        const { messageId, expressionId } = data;
        if (!messageId || !expressionId) return;
        
        console.log(`${MODULE_NAME}: 표정 업데이트 - 메시지 ID: ${messageId}, 표정: ${expressionId}`);
        
        // 메시지 요소 찾기
        const messageElement = $(`.mes[mesid="${messageId}"]`);
        if (messageElement.length === 0) return;
        
        // 사용자 메시지 여부 확인
        const isUserMessage = messageElement.hasClass('user');
        if (isUserMessage && !extension_settings[MODULE_NAME].applyToUser) return;
        
        // 표정 아바타 적용
        applyExpressionAvatar(messageElement, expressionId, isUserMessage);
    } catch (error) {
        console.error(`${MODULE_NAME}: 표정 업데이트 처리 중 오류가 발생했습니다.`, error);
    }
}

/**
 * 메시지 렌더링 이벤트 핸들러
 */
function handleMessageRendered(data) {
    if (!extension_settings[MODULE_NAME].enabled) return;
    
    try {
        let messageElement;
        
        if (data.messageEl) {
            messageElement = data.messageEl;
        } else if (data.id) {
            messageElement = $(`.mes[mesid="${data.id}"]`);
        } else {
            return;
        }
        
        if (messageElement.length === 0) return;
        
        const messageId = messageElement.attr('mesid');
        if (!messageId) return;
        
        // expressions 확장으로부터 현재 적용된 표정 확인
        if (window.tag_map && window.tag_map.has(messageId)) {
            const expressionId = window.tag_map.get(messageId);
            if (expressionId) {
                const isUserMessage = messageElement.hasClass('user');
                if (isUserMessage && !extension_settings[MODULE_NAME].applyToUser) return;
                
                // 표정 아바타 적용
                applyExpressionAvatar(messageElement, expressionId, isUserMessage);
            }
        }
    } catch (error) {
        console.error(`${MODULE_NAME}: 메시지 렌더링 처리 중 오류가 발생했습니다.`, error);
    }
}

/**
 * 메시지 편집 이벤트 핸들러
 */
function handleMessageEdited(data) {
    // 메시지 렌더링 핸들러와 동일하게 처리
    handleMessageRendered(data);
}

/**
 * 표정 아바타 적용 함수
 */
function applyExpressionAvatar(messageElement, expressionId, isUserMessage) {
    try {
        // 아바타 요소 찾기
        const avatarImg = messageElement.find('.avatar img');
        if (avatarImg.length === 0) return;
        
        // 이미 적용된 표정 아바타 요소 확인
        let expressionAvatarElement = messageElement.find('.expression_avatar_container');
        
        // 원본 아바타 URL
        const originalSrc = avatarImg.attr('src');
        
        // 표정 이미지 URL 생성
        const expressionImageUrl = `extensions/expressions/assets/${expressionId}.png`;
        
        // 표정 이미지 로드 테스트
        const testImg = new Image();
        testImg.onload = function() {
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
                const expressionAvatarImg = $(`<img src="${expressionImageUrl}" alt="${expressionId}" class="expression_avatar">`);
                
                // 이미지 스타일 설정
                expressionAvatarImg.css({
                    'max-height': `${extension_settings[MODULE_NAME].avatarHeight}px`,
                    'max-width': '100%',
                    'object-fit': 'contain'
                });
                
                // 컨테이너에 이미지 추가
                expressionAvatarElement.append(expressionAvatarImg);
                
                // 아바타 컨테이너에 표정 아바타 추가
                avatarImg.parent().append(expressionAvatarElement);
                
                // 원본 아바타 투명도 설정
                if (extension_settings[MODULE_NAME].keepOriginalAvatar) {
                    avatarImg.css('opacity', extension_settings[MODULE_NAME].originalAvatarOpacity);
                } else {
                    avatarImg.css('opacity', '0');
                }
            } else {
                // 기존 표정 이미지 업데이트
                expressionAvatarElement.find('.expression_avatar').attr('src', expressionImageUrl);
            }
        };
        
        testImg.onerror = function() {
            console.warn(`${MODULE_NAME}: 표정 이미지를 로드할 수 없습니다: ${expressionImageUrl}`);
            
            // 표정 이미지가 없는 경우 표정 아바타 제거
            if (expressionAvatarElement.length > 0) {
                expressionAvatarElement.remove();
                avatarImg.css('opacity', '1');
            }
        };
        
        testImg.src = expressionImageUrl;
    } catch (error) {
        console.error(`${MODULE_NAME}: 표정 아바타 적용 중 오류가 발생했습니다.`, error);
    }
}
