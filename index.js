import { getContext, extension_settings, extensionSendMessage, registerExtension } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';
import { hideAllTokenBadges, repaintTokenBadges } from '../../../tokenizers.js';
import { dragElement } from '../../../RossAscends-mods.js';

const extensionName = 'expression_avatar';
const defaultSettings = {
    enabled: false,
    keepOriginalAvatar: false,
    originalOpacity: 0.5,
    avatarHeight: 160,
    applyToUserMessages: false,
    mobileSupport: true
};

// 초기화
function initExpressionAvatar() {
    // 설정 초기화
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }

    // 기본 설정 적용
    for (const key in defaultSettings) {
        if (extension_settings[extensionName][key] === undefined) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }

    // UI 설정
    const settingsHtml = `
        <div class="expression_avatar_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>표정 아바타 모드</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label class="checkbox_label">
                        <input type="checkbox" id="expression_avatar_enabled" ${extension_settings[extensionName].enabled ? 'checked' : ''}>
                        <span>활성화</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="expression_avatar_keep_original" ${extension_settings[extensionName].keepOriginalAvatar ? 'checked' : ''}>
                        <span>원본 아바타 유지</span>
                    </label>
                    <label>
                        <span>원본 아바타 투명도:</span>
                        <input type="range" id="expression_avatar_opacity" min="0" max="1" step="0.1" value="${extension_settings[extensionName].originalOpacity}">
                        <span id="expression_avatar_opacity_value">${extension_settings[extensionName].originalOpacity}</span>
                    </label>
                    <label>
                        <span>아바타 높이 (px):</span>
                        <input type="number" id="expression_avatar_height" min="40" max="500" value="${extension_settings[extensionName].avatarHeight}">
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="expression_avatar_apply_to_user" ${extension_settings[extensionName].applyToUserMessages ? 'checked' : ''}>
                        <span>사용자 메시지에도 적용</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="expression_avatar_mobile_support" ${extension_settings[extensionName].mobileSupport ? 'checked' : ''}>
                        <span>모바일 지원</span>
                    </label>
                </div>
            </div>
        </div>
    `;

    $('#extensions_settings').append(settingsHtml);
    
    // 이벤트 핸들러 설정
    $('#expression_avatar_enabled').on('change', function() {
        extension_settings[extensionName].enabled = $(this).prop('checked');
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled) {
            applyExpressionsToAllMessages();
        } else {
            resetAllAvatars();
        }
    });

    $('#expression_avatar_keep_original').on('change', function() {
        extension_settings[extensionName].keepOriginalAvatar = $(this).prop('checked');
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled) {
            applyExpressionsToAllMessages();
        }
    });

    $('#expression_avatar_opacity').on('input', function() {
        const value = parseFloat($(this).val());
        extension_settings[extensionName].originalOpacity = value;
        $('#expression_avatar_opacity_value').text(value);
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled && extension_settings[extensionName].keepOriginalAvatar) {
            updateAllAvatarOpacity();
        }
    });

    $('#expression_avatar_height').on('change', function() {
        extension_settings[extensionName].avatarHeight = parseInt($(this).val());
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled) {
            updateAllAvatarHeight();
        }
    });

    $('#expression_avatar_apply_to_user').on('change', function() {
        extension_settings[extensionName].applyToUserMessages = $(this).prop('checked');
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled) {
            applyExpressionsToAllMessages();
        }
    });

    $('#expression_avatar_mobile_support').on('change', function() {
        extension_settings[extensionName].mobileSupport = $(this).prop('checked');
        saveSettingsDebounced();
        
        if (extension_settings[extensionName].enabled) {
            applyExpressionsToAllMessages();
        }
    });

    // 표정 변화 이벤트 리스너 설정
    eventSource.on(event_types.CHAT_CHANGED, handleChatChange);
    eventSource.on(event_types.MESSAGE_RECEIVED, handleMessageUpdate);
    eventSource.on(event_types.MESSAGE_SENT, handleMessageUpdate);
    eventSource.on(event_types.EXPRESSION_CHANGED, handleExpressionChange);

    // DOM 변화 감지기 설정
    setupMutationObserver();

    // 초기 적용
    if (extension_settings[extensionName].enabled) {
        applyExpressionsToAllMessages();
    }
}

// 모든 메시지에 표정 적용
function applyExpressionsToAllMessages() {
    if (!extension_settings[extensionName].enabled) return;
    
    // 모든 메시지 요소 가져오기
    const messages = document.querySelectorAll('#chat .mes');
    
    messages.forEach(message => {
        const isUser = message.classList.contains('user');
        
        // 사용자 메시지는 설정에 따라 처리
        if (isUser && !extension_settings[extensionName].applyToUserMessages) {
            resetAvatar(message);
            return;
        }
        
        // 캐릭터 이름과 표정 이름 가져오기
        const characterName = message.getAttribute('data-character');
        let expressionName = message.getAttribute('data-expression') || 'neutral';
        
        // 표정 이미지 적용
        applyExpressionToMessage(message, characterName, expressionName);
    });
}

// 특정 메시지에 표정 적용
function applyExpressionToMessage(messageElement, characterName, expressionName) {
    if (!extension_settings[extensionName].enabled) return;
    
    // 모바일 환경 체크
    const isMobile = window.innerWidth <= 780;
    if (isMobile && !extension_settings[extensionName].mobileSupport) return;
    
    const avatarContainer = messageElement.querySelector('.avatar');
    if (!avatarContainer) return;
    
    const avatarImg = avatarContainer.querySelector('img');
    if (!avatarImg) return;
    
    // 원본 이미지 URL 저장 (아직 저장되지 않았다면)
    if (!avatarImg.dataset.originalSrc) {
        avatarImg.dataset.originalSrc = avatarImg.src;
    }
    
    // 표정 이미지 URL 가져오기
    const expressionUrl = getExpressionImageUrl(characterName, expressionName);
    if (!expressionUrl) {
        // 표정 이미지가 없으면 원본으로 복원
        resetAvatar(messageElement);
        return;
    }
    
    // 아바타 높이 적용
    avatarContainer.style.height = `${extension_settings[extensionName].avatarHeight}px`;
    
    if (extension_settings[extensionName].keepOriginalAvatar) {
        // 원본 아바타 유지 모드
        avatarImg.style.opacity = extension_settings[extensionName].originalOpacity;
        
        // 표정 오버레이 엘리먼트 확인
        let expressionOverlay = avatarContainer.querySelector('.expression-overlay');
        
        if (!expressionOverlay) {
            // 새 오버레이 생성
            expressionOverlay = document.createElement('div');
            expressionOverlay.className = 'expression-overlay';
            expressionOverlay.style.position = 'absolute';
            expressionOverlay.style.top = '0';
            expressionOverlay.style.left = '0';
            expressionOverlay.style.width = '100%';
            expressionOverlay.style.height = '100%';
            expressionOverlay.style.zIndex = '1';
            expressionOverlay.style.backgroundSize = 'cover';
            expressionOverlay.style.backgroundPosition = 'center';
            expressionOverlay.style.pointerEvents = 'none';
            
            // 상대적 위치 설정을 위한 컨테이너 스타일 수정
            avatarContainer.style.position = 'relative';
            
            // 오버레이 추가
            avatarContainer.appendChild(expressionOverlay);
        }
        
        // 배경 이미지로 표정 적용
        expressionOverlay.style.backgroundImage = `url('${expressionUrl}')`;
    } else {
        // 원본 아바타 대체 모드
        avatarImg.src = expressionUrl;
    }
}

// 표정 변화 처리 함수
function handleExpressionChange(data) {
    if (!extension_settings[extensionName].enabled) return;
    
    const { character, expression } = data;
    
    // 캐릭터 이름이 일치하는 모든 메시지 찾기
    const messages = document.querySelectorAll(`#chat .mes[data-character="${character.name}"]`);
    
    messages.forEach(message => {
        // 메시지에 표정 정보 저장
        message.setAttribute('data-expression', expression);
        
        // 표정 적용
        applyExpressionToMessage(message, character.name, expression);
    });
}

// 메시지 업데이트 처리
function handleMessageUpdate(data) {
    if (!extension_settings[extensionName].enabled) return;
    
    // 약간의 지연 후 처리 (DOM 업데이트 기다림)
    setTimeout(() => {
        // 가장 최근 메시지 찾기
        const latestMessage = document.querySelector('#chat .mes:last-child');
        if (!latestMessage) return;
        
        const isUser = latestMessage.classList.contains('user');
        
        // 사용자 메시지는 설정에 따라 처리
        if (isUser && !extension_settings[extensionName].applyToUserMessages) {
            resetAvatar(latestMessage);
            return;
        }
        
        const characterName = latestMessage.getAttribute('data-character');
        const expressionName = latestMessage.getAttribute('data-expression') || 'neutral';
        
        applyExpressionToMessage(latestMessage, characterName, expressionName);
    }, 100);
}

// 채팅 변경 처리
function handleChatChange() {
    if (!extension_settings[extensionName].enabled) return;
    
    // 약간의 지연 후 모든 메시지에 표정 적용
    setTimeout(() => {
        applyExpressionsToAllMessages();
    }, 300);
}

// 표정 이미지 URL 가져오기
function getExpressionImageUrl(characterName, expressionName) {
    // SillyTavern의 내부 함수 사용
    try {
        // expressions 확장의 API 참조
        const expressionsApi = getContext().expressions;
        if (expressionsApi && expressionsApi.getExpressionImageUrl) {
            return expressionsApi.getExpressionImageUrl(characterName, expressionName);
        }
        
        // 대체 방법: 직접 이미지 경로 구성
        const character = getContext().characters.find(c => c.name === characterName);
        if (character && character.expressions && character.expressions[expressionName]) {
            return character.expressions[expressionName];
        }
    } catch (error) {
        console.error(`[Expression Avatar] 표정 이미지 URL 가져오기 실패:`, error);
    }
    
    return null;
}

// 아바타 초기화
function resetAvatar(messageElement) {
    const avatarContainer = messageElement.querySelector('.avatar');
    if (!avatarContainer) return;
    
    const avatarImg = avatarContainer.querySelector('img');
    if (!avatarImg) return;
    
    // 원본 소스가 저장되어 있으면 복원
    if (avatarImg.dataset.originalSrc) {
        avatarImg.src = avatarImg.dataset.originalSrc;
        avatarImg.style.opacity = '';
    }
    
    // 오버레이 제거
    const expressionOverlay = avatarContainer.querySelector('.expression-overlay');
    if (expressionOverlay) {
        expressionOverlay.remove();
    }
    
    // 스타일 정리
    avatarContainer.style.position = '';
    avatarContainer.style.height = '';
}

// 모든 아바타 초기화
function resetAllAvatars() {
    const messages = document.querySelectorAll('#chat .mes');
    messages.forEach(message => {
        resetAvatar(message);
    });
}

// 모든 아바타 투명도 업데이트
function updateAllAvatarOpacity() {
    if (!extension_settings[extensionName].keepOriginalAvatar) return;
    
    const opacity = extension_settings[extensionName].originalOpacity;
    const avatarImgs = document.querySelectorAll('#chat .mes .avatar img');
    
    avatarImgs.forEach(img => {
        img.style.opacity = opacity;
    });
}

// 모든 아바타 높이 업데이트
function updateAllAvatarHeight() {
    const height = extension_settings[extensionName].avatarHeight;
    const avatarContainers = document.querySelectorAll('#chat .mes .avatar');
    
    avatarContainers.forEach(container => {
        container.style.height = `${height}px`;
    });
}

// 뮤테이션 옵저버 설정
function setupMutationObserver() {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;
    
    const observer = new MutationObserver(mutations => {
        if (!extension_settings[extensionName].enabled) return;
        
        let shouldUpdate = false;
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mes')) {
                        shouldUpdate = true;
                        break;
                    }
                }
            }
        });
        
        if (shouldUpdate) {
            applyExpressionsToAllMessages();
        }
    });
    
    observer.observe(chatContainer, { childList: true, subtree: true });
}

// 초기화 실행
jQuery(function() {
    initExpressionAvatar();
});
