const APPROVAL_API_URL = 'https://tpglink.paywelcome.co.kr/pglink/approve';
const NETCANCEL_API_URL = 'https://tpglink.paywelcome.co.kr/pglink/cancel/netcancel';

const MID = 'welcometst';
const API_KEY = 'b920187ab55b86caaf1b9029f3597baa';
// const MID = process.env.MID; // 환경 변수에서 상점 ID를 가져옵니다
// const API_KEY = process.env.API_KEY; // 환경 변수에서 API 키를 가져옵니다    

async function approvePayment(key, amount, orderId) {
    const res = await fetch(APPROVAL_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Welcomepayments ${API_KEY}`
        },
        body: JSON.stringify({
            key: key,
            amount: amount
        })
    });

    return await res.json();
}

async function notifyPaymentAlram(key, amount, orderId, msg) {
    // 결제 알림을 보내는 로직을 여기에 추가하세요
    console.log('결제 알림:', msg, key, amount, orderId);
}

async function netcancelPayment(key, amount, orderId) {
    try {
        const res = await fetch(NETCANCEL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Welcomepayments ${API_KEY}`
            },
            body: JSON.stringify({
                mid: MID,
                key: key,
                amount: amount
            })
        });

        const data = await res.json();

        if (data.resultCode === '0000') {
            console.log('망취소 성공:', data);
            return true;
        } else {
            console.error('망취소 실패:', data);
            return false;
        }
    } catch (error) {
        console.error('망취소 중 오류 발생:', error);
        await notifyPaymentAlram(key, amount, orderId, '망취소 중 오류 발생');
        return false;
    }
}

module.exports = { approvePayment, netcancelPayment };