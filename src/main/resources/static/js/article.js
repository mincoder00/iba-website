// 삭제 기능
const deleteButton = document.getElementById('delete-btn');

if (deleteButton) {
    deleteButton.addEventListener('click', event => {
        let id = document.getElementById('article-id').value;
        function success() {
            alert('삭제가 완료되었습니다.');
            location.replace('/articles');
        }

        function fail() {
            alert('삭제 실패했습니다.');
            location.replace('/articles');
        }

        httpRequest('DELETE',`/api/articles/${id}`, null, success, fail);
    });
}

// 하이퍼링크 변환 함수
function transformLinks(text) {
    const urlPattern = /(?<!<a\s+href=["'])(\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?![^<]*<\/a>)/ig;
    return text.replace(urlPattern, url => {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

// 수정 기능
const modifyButton = document.getElementById('modify-btn');

if (modifyButton) {
    modifyButton.addEventListener('click', event => {
        let params = new URLSearchParams(location.search);
        let id = params.get('id');

        const title = document.getElementById('title').value;
        const contentElement = document.getElementById('content');
        const content = contentElement.value;
        const formattedContent = transformLinks(content.replace(/\n/g, '<br>'));
        const category = document.getElementById('category').value;

        if (!title || title.trim() === '') {
            alert('제목은 필수 항목입니다.');
            return;
        }

        body = JSON.stringify({
            title: title,
            content: formattedContent,
            category: category
        });

        function success() {
            alert('수정이 완료되었습니다.');
            location.replace(`/articles/${id}`);
        }

        function fail() {
            alert('수정 실패했습니다.');
            location.replace(`/articles/${id}`);
        }

        httpRequest('PUT', `/api/articles/${id}`, body, success, fail);
    });
}

// 생성 기능
const createButton = document.getElementById('create-btn');

if (createButton) {
    // 등록 버튼을 클릭하면 /api/articles 요청을 보낸다
    createButton.addEventListener('click', event => {
        const title = document.getElementById('title').value;
        const contentElement = document.getElementById('content');
        const content = contentElement.value;
        const formattedContent = transformLinks(content.replace(/\n/g, '<br>'));
        const category = document.getElementById('category').value;

        if (!title || title.trim() === '') {
            alert('제목은 필수 항목입니다.');
            return;
        }

        body = JSON.stringify({
            title: title,
            content: formattedContent,
            category: category
        });

        function success() {
            alert('등록 완료되었습니다.');
            location.replace('/articles');
        }

        function fail() {
            alert('등록 실패했습니다.');
            location.replace('/articles');
        }

        httpRequest('POST', '/api/articles', body, success, fail);
    });
}

// 로그아웃 기능
const logoutButton = document.getElementById('logout-btn');

if (logoutButton) {
    logoutButton.addEventListener('click', event => {
        function success() {
            // 로컬 스토리지에 저장된 액세스 토큰을 삭제
            localStorage.removeItem('access_token');

            // 쿠키에 저장된 리프레시 토큰을 삭제
            deleteCookie('refresh_token');
            location.replace('/about');
        }
        function fail() {
            alert('로그아웃 실패했습니다.');
        }

        httpRequest('DELETE','/api/refresh-token', null, success, fail);
    });
}

// 쿠키를 가져오는 함수
function getCookie(key) {
    var result = null;
    var cookie = document.cookie.split(';');
    cookie.some(function (item) {
        item = item.replace(' ', '');

        var dic = item.split('=');

        if (key === dic[0]) {
            result = dic[1];
            return true;
        }
    });

    return result;
}

// 쿠키를 삭제하는 함수
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


// HTTP 요청을 보내는 함수
function httpRequest(method, url, body, success, fail) {
    fetch(url, {
        method: method,
        headers: { // 로컬 스토리지에서 액세스 토큰 값을 가져와 헤더에 추가
            Authorization: 'Bearer ' + localStorage.getItem('access_token'),
            'Content-Type': 'application/json',
        },
        body: body,
    }).then(response => {
        if (response.status === 200 || response.status === 201) {
            return success();
        }
        const refresh_token = getCookie('refresh_token');
        if (response.status === 401 && refresh_token) {
            fetch('/api/token', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('access_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: getCookie('refresh_token'),
                }),
            })
                .then(res => {
                    if (res.ok) {
                        return res.json();
                    }
                })
                .then(result => { // 재발급이 성공하면 로컬 스토리지값을 새로운 액세스 토큰으로 교체
                    localStorage.setItem('access_token', result.accessToken);
                    httpRequest(method, url, body, success, fail);
                })
                .catch(error => fail());
        } else {
            return fail();
        }
    });
}
