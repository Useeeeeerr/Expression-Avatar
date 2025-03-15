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
    debug: true
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
    
    // 초기 상태 확인
    checkExtensionStatus();
    
    console.log(`${MODULE_NAME}: 확장이 초기화되었습니다.`);
});

/**
 * 확장 상태 확인 함수
 */
function checkExtensionStatus() {
    // expressions 확장 사용 가능 여부 확인
    const expressionsEnabled = window.extension_settings && 
                             window.extension_settings.expressions &&
                             window.extension_settings.expressions.enabled;
    
    if (!expressionsEnabled) {
        console.warn(`${MODULE_NAME}: expressions 확장이 활성화되어 있지 않습니다. 이 확장은 expressions 확장이 필요합니다.`);
        $('#expression_avatar_status').text('상태: expressions 확장이 활성화되어 있지 않습니다!').css('color', 'red');
    } else {
        console.log(`${MODULE_NAME}: expressions 확장 확인 완료, 활성화됨`);
        $('#expression_avatar_status').text('상태: 정상').css('color', 'green');
        
        // tag_map 확인 (expressions 확장의 표정 매핑 변수)
        if (window.tag_map) {
            console.log(`${MODULE_NAME}: tag_map 발견, 항목 수: ${window.tag_map.size}`);
        } else {
            console.warn(`${MODULE_NAME}: tag_map을 찾을 수 없습니다. expressions 확장이 최신 버전인지 확인하세요.`);
        }
    }
}

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
                <div id="expression_avatar_status" style="margin-bottom: 10px;">상태: 확인 중...</div>
                
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
                        <input type="checkbox" id="expression_avatar_debug">
                        <span>디버그 모드</span>
                    </label>
                </div>
                
                <div class="expression_avatar_note">
                    <p><i>참고: 이 확장은 SillyTavern의 expressions 확장과 연동하여 동작합니다.</i></p>
                    <p><i>이미지 경로: data/default-user/characters/[캐릭터명]/[표정id].png</i></p>
                    <button id="expression_avatar_test" class="menu_button">표정 테스트</button>
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
    $('#expression_avatar_debug').prop('checked', extension_settings[MODULE_NAME].debug);
    
    // 이벤트 리스너 등록
    $('#expression_avatar_enabled').on('change', saveSettings);
    $('#expression_avatar_keep_original').on('change', saveSettings);
    $('#expression_avatar_opacity').on('input', function() {
        $('#expression_avatar_opacity_value').text($(this).val());
        saveSettings();
    });
    $('#expression_avatar_height').on('input', saveSettings);
    $('#expression_avatar_apply_to_user').on('change', saveSettings);
    $('#expression_avatar_debug').on('change', saveSettings);
    
    // 드로어 헤더 클릭 이벤트
    $('#expression_avatar_settings .expression_avatar_header').on('click', function() {
        $('#expression_avatar_settings .expression_avatar_block').toggle();
    });
    
    // 테스트 버튼 이벤트
    $('#expression_avatar_test').on('click', testExpressionAvatar);
}

/**
 * 표정 아바타 테스트 함수
 */
function testExpressionAvatar() {
    console.log(`${MODULE_NAME}: 표정 테스트 시작...`);
    
    // 최신 메시지 찾기
    const latestMessage = $('.mes').last();
    if (latestMessage.length === 0) {
        console.warn(`${MODULE_NAME}: 테스트할 메시지를 찾을 수 없습니다.`);
        alert('표정 테스트를 위한 메시지가 없습니다. 대화를 시작해 주세요.');
        return;
    }
    
    // 현재 캐릭터 이름 가져오기
    const characterName = getCharacterName();
    if (!characterName) {
        console.warn(`${MODULE_NAME}: 현재 캐릭터 이름을 찾을 수 없습니다.`);
        alert('현재 캐릭터 이름을 찾을 수 없습니다.');
        return;
    }
    
    // 표정 목록 (expressions 확장의 실제 표정 ID 목록)
    const expressions = ['happiness', 'sadness', 'anger', 'surprise', 'fear', 'disgust', 'neutral'];
    
    // 각 표정 순서대로 테스트
    let delay = 0;
    expressions.forEach(expression => {
        setTimeout(() => {
            console.log(`${MODULE_NAME}: 표정 테스트 - ${expression}`);
            testExpressionForCharacter(latestMessage, expression, characterName);
        }, delay);
        delay += 1000; // 각 표정을 1초 간격으로 표시
    });
    
    // 테스트 후 메시지
    setTimeout(() => {
        console.log(`${MODULE_NAME}: 표정 테스트 완료`);
        alert('표정 테스트가 완료되었습니다. 콘솔(F12)에서 로그를 확인하세요.');
    }, delay);
}

/**
 * 현재 선택된 캐릭터 이름 가져오기
 */
function getCharacterName() {
    if (characters && characters[this_chid]) {
        return characters[this_chid].name;
    }
    return null;
}

/**
 * 캐릭터별 표정 테스트
 */
function testExpressionForCharacter(messageElement, expressionId, characterName) {
    try {
        // 테스트 이미지 경로 생성
        const testImagePath = `data/default-user/characters/${characterName}/${expressionId}.png`;
        logDebug(`캐릭터 표정 테스트 - ${characterName}/${expressionId} 경로: ${testImagePath}`);
        
        // 이미지 테스트 및 적용
        const testImg = new Image();
        testImg.onload = function() {
            logDebug(`표정 이미지 로드 성공: ${testImagePath}`);
            applyExpressionAvatar(messageElement, expressionId, messageElement.hasClass('user'), characterName);
        };
        
        testImg.onerror = function() {
            console.warn(`${MODULE_NAME}: 표정 이미지 로드 실패: ${testImagePath}`);
        };
        
        testImg.src = testImagePath;
    } catch (error) {
        console.error(`${MODULE_NAME}: 테스트 중 오류 발생:`, error);
    }
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
    extension_settings[MODULE_NAME].debug = $('#expression_avatar_debug').is(':checked');
    
    // SillyTavern의 설정 저장 함수 호출
    if (typeof saveSettingsDebounced === 'function') {
        saveSettingsDebounced();
    } else {
        console.warn(`${MODULE_NAME}: saveSettingsDebounced 함수를 찾을 수 없습니다.`);
    }
    
    console.log(`${MODULE_NAME}: 설정이 저장되었습니다.`);
}

/**
 * 로그 출력 함수 (디버그 모드일 때만 로그 출력)
 */
function logDebug(...args) {
    if (extension_settings[MODULE_NAME].debug) {
        console.log(`${MODULE_NAME}:`, ...args);
    }
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
        
        logDebug(`표정 업데이트 - 메시지 ID: ${messageId}, 표정: ${expressionId}`);
        
        // 메시지 요소 찾기
        const messageElement = $(`.mes[mesid="${messageId}"]`);
        if (messageElement.length === 0) {
            logDebug(`메시지 ID ${messageId}에 해당하는 요소를 찾을 수 없습니다.`);
            return;
        }
        
        // 사용자 메시지 여부 확인
        const isUserMessage = messageElement.hasClass('user');
        if (isUserMessage && !extension_settings[MODULE_NAME].applyToUser) {
            logDebug(`사용자 메시지에 표정을 적용하지 않도록 설정되어 있습니다.`);
            return;
        }
        
        // 현재 캐릭터 이름 가져오기
        const characterName = isUserMessage ? "you" : getCharacterName();
        
        // 표정 아바타 적용
        applyExpressionAvatar(messageElement, expressionId, isUserMessage, characterName);
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
        
        logDebug(`메시지 렌더링 - 메시지 ID: ${messageId}`);
        
        // 사용자 메시지 여부 확인
        const isUserMessage = messageElement.hasClass('user');
        
        // 현재 캐릭터 이름 가져오기
        const characterName = isUserMessage ? "you" : getCharacterName();
        
        // window.tag_map 확인 (expressions 확장의 표정 맵)
        if (window.tag_map && window.tag_map.has(messageId)) {
            const expressionId = window.tag_map.get(messageId);
            if (expressionId) {
                logDebug(`tag_map에서 찾은 표정: ${expressionId}`);
                if (isUserMessage && !extension_settings[MODULE_NAME].applyToUser) return;
                
                // 표정 아바타 적용
                applyExpressionAvatar(messageElement, expressionId, isUserMessage, characterName);
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
function applyExpressionAvatar(messageElement, expressionId, isUserMessage, characterName) {
    try {
        // 아바타 요소 찾기
        const avatarImg = messageElement.find('.avatar img');
        if (avatarImg.length === 0) {
            logDebug('아바타 이미지 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 이미 적용된 표정 아바타 요소 확인
        let expressionAvatarElement = messageElement.find('.expression_avatar_container');
        
        // 원본 아바타 URL
        const originalSrc = avatarImg.attr('src');
        
        // 표정 이미지 URL 생성 (SillyTavern의 expressions 확장과 호환되는 경로)
        const expressionImageUrl = `data/default-user/characters/${characterName}/${expressionId}.png`;
        
        logDebug(`표정 이미지 URL: ${expressionImageUrl}`);
        
        // 표정 이미지 로드 테스트
        const testImg = new Image();
        testImg.onload = function() {
            logDebug(`표정 이미지 로드 성공: ${expressionImageUrl}`);
            
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
                    'z-index': '2',
                    'pointer-events': 'none'
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
                
                logDebug(`표정 아바타가 추가되었습니다. 메시지 ID: ${messageElement.attr('mesid')}`);
            } else {
                // 기존 표정 이미지 업데이트
                expressionAvatarElement.find('.expression_avatar').attr('src', expressionImageUrl);
                logDebug(`기존 표정 아바타가 업데이트되었습니다. 메시지 ID: ${messageElement.attr('mesid')}`);
            }
        };
        
        testImg.onerror = function() {
            console.warn(`${MODULE_NAME}: 표정 이미지를 찾을 수 없습니다: ${expressionImageUrl}`);
            
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
