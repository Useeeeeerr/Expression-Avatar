// 확장 프로그램 정보
const extensionName = 'Expression Avatar';
const extensionId = 'expression_avatar';
const extensionIcon = 'fa-face-smile';

// 전역 변수
let expressionAvatarEnabled = false;
let currentCharacter = null;
let expressionImages = {};
let defaultAvatarImg = null;
let lastMessage = null;

// 설정 저장 및 로드 함수
function saveSettings() {
    localStorage.setItem('expression_avatar_settings', JSON.stringify({
        enabled: expressionAvatarEnabled
    }));
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('expression_avatar_settings') || '{}');
    expressionAvatarEnabled = settings.enabled !== undefined ? settings.enabled : false;
    
    // UI 업데이트
    const checkbox = document.getElementById('expression_avatar_enabled');
    if (checkbox) {
        checkbox.checked = expressionAvatarEnabled;
    }
}

// 확장 프로그램 초기화
async function onExtensionLoad() {
    // HTML 로드
    await loadSettingsHTML();
    
    // 설정 초기화
    loadSettings();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    console.log(`${extensionName} extension loaded`);
}

// HTML 로드 함수
async function loadSettingsHTML() {
    try {
        const response = await fetch('scripts/extensions/third-party/ST_expression_avatar/index.html');
        if (!response.ok) {
            console.error(`${extensionName}: Failed to load HTML`);
            return;
        }
        
        const html = await response.text();
        const settingsDiv = document.getElementById('extensions_settings');
        if (!settingsDiv) {
            console.error(`${extensionName}: Could not find extensions_settings element`);
            return;
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        settingsDiv.appendChild(tempDiv.firstElementChild);
    } catch (error) {
        console.error(`${extensionName}: Error loading HTML`, error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 설정 변경 이벤트
    const checkbox = document.getElementById('expression_avatar_enabled');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            expressionAvatarEnabled = this.checked;
            saveSettings();
            
            // 설정이 변경되면 현재 아바타 업데이트
            if (currentCharacter) {
                updateCharacterAvatar();
            }
        });
    }
    
    // SillyTavern 이벤트 구독
    eventSource.on('characterSelected', onCharacterSelected);
    
    // 메시지 처리를 위한 MutationObserver 설정
    setupMessageObserver();
}

// 메시지 관찰자 설정
function setupMessageObserver() {
    const chatElement = document.getElementById('chat');
    if (!chatElement) return;
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mes')) {
                        processMessageElement(node);
                    }
                }
            }
        }
    });
    
    observer.observe(chatElement, { childList: true, subtree: false });
}

// 메시지 요소 처리
function processMessageElement(messageElement) {
    if (!expressionAvatarEnabled || !currentCharacter) return;
    
    // AI 메시지인지 확인
    const isAiMessage = messageElement.classList.contains('ai_user');
    if (!isAiMessage) return;
    
    // 메시지 내용에서 표정 태그 찾기
    const messageText = messageElement.querySelector('.mes_text')?.innerText || '';
    const expressionTag = findExpressionTag(messageText);
    
    if (expressionTag && expressionImages[expressionTag]) {
        // 메시지 아바타 요소 찾기
        const avatarElement = messageElement.querySelector('.avatar img');
        if (avatarElement) {
            // 아바타 이미지 변경
            avatarElement.src = expressionImages[expressionTag];
            
            // 마지막 메시지 저장
            lastMessage = {
                element: messageElement,
                expression: expressionTag
            };
        }
    }
}

// 표정 태그 찾기 함수
function findExpressionTag(text) {
    // 원본 expressions 확장 프로그램과 동일한 정규식 패턴 사용
    const expressionRegex = /\{([^{}]+)\}/g;
    const matches = Array.from(text.matchAll(expressionRegex));
    
    if (matches.length > 0) {
        // 마지막 표정 태그 사용
        const lastMatch = matches[matches.length - 1];
        return lastMatch[1].toLowerCase().trim();
    }
    
    return null;
}

// 캐릭터 선택 이벤트 핸들러
async function onCharacterSelected(character) {
    currentCharacter = character;
    
    // 기본 아바타 저장
    defaultAvatarImg = character.avatar;
    
    // 표정 이미지 로드
    await loadExpressionImages(character);
    
    // 아바타 업데이트
    updateCharacterAvatar();
}

// 표정 이미지 로드 함수
async function loadExpressionImages(character) {
    expressionImages = {};
    
    try {
        // 캐릭터 표정 이미지 가져오기 (원본 확장 프로그램과 동일한 엔드포인트 사용)
        const response = await fetch(`/getallexpression?name=${encodeURIComponent(character.name)}`);
        if (!response.ok) {
            console.warn(`${extensionName}: Failed to load expression images`);
            return;
        }
        
        const data = await response.json();
        if (data && Array.isArray(data)) {
            // 표정 이미지 매핑
            for (const expression of data) {
                const name = expression.label.toLowerCase();
                expressionImages[name] = expression.path;
            }
            console.log(`${extensionName}: Loaded ${Object.keys(expressionImages).length} expression images`);
        }
    } catch (error) {
        console.error(`${extensionName}: Error loading expression images`, error);
    }
}

// 캐릭터 아바타 업데이트 함수
function updateCharacterAvatar() {
    if (!currentCharacter) return;
    
    // 아바타 요소 찾기
    const avatarElement = document.querySelector('#chat_avatar img');
    if (!avatarElement) return;
    
    // 확장 프로그램이 활성화되어 있고 기본 표정이 있으면 변경
    if (expressionAvatarEnabled && expressionImages['neutral']) {
        avatarElement.src = expressionImages['neutral'];
    } else {
        // 아니면 기본 아바타로 복원
        avatarElement.src = defaultAvatarImg;
    }
    
    // 이전 메시지들의 표정도 업데이트
    updateExistingMessages();
}

// 기존 메시지 업데이트
function updateExistingMessages() {
    if (!expressionAvatarEnabled) return;
    
    const messages = document.querySelectorAll('#chat .mes.ai_user');
    messages.forEach(messageElement => {
        processMessageElement(messageElement);
    });
}

// 확장 프로그램 언로드
function onExtensionUnload() {
    // 기본 아바타로 복원
    if (currentCharacter) {
        const avatarElement = document.querySelector('#chat_avatar img');
        if (avatarElement && defaultAvatarImg) {
            avatarElement.src = defaultAvatarImg;
        }
        
        // 모든 메시지 아바타 복원
        restoreMessageAvatars();
    }
    
    console.log(`${extensionName} extension unloaded`);
}

// 메시지 아바타 복원
function restoreMessageAvatars() {
    const messages = document.querySelectorAll('#chat .mes.ai_user');
    messages.forEach(messageElement => {
        const avatarElement = messageElement.querySelector('.avatar img');
        if (avatarElement && defaultAvatarImg) {
            avatarElement.src = defaultAvatarImg;
        }
    });
}

// SillyTavern 익스텐션 API 등록
window['extension_expression_avatar'] = {
    name: extensionName,
    icon: extensionIcon,
    id: extensionId,
    
    // 필수 함수
    init: onExtensionLoad,
    
    // 선택적 함수
    destroy: onExtensionUnload,
    
    // 설정 페이지 요소 ID
    settings: 'extension-expression-avatar-settings'
};
