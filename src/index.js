const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // cors 패키지 추가
const { approvePayment, cancelPayment, netcancelPayment } = require('./payments');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS 설정 추가
app.use(cors());

// body-parser 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function checkAmount(orderId, payAmount) {
  // DB에서 원래 주문 금액을 조회하는 로직을 여기에 추가하세요
  const originalAmount = "1004"; // getAmountFromDB(orderId);
  return payAmount === originalAmount; // 예시 금액
}

async function postApprovePayments(key, amount, orderId) {
  return true;
}

// 승인 처리 API 엔드포인트
app.post('/approve', async (req, res) => {
  // Content-Type 검증
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400).json({ result: "INVALID_CONTENT_TYPE", message: "Content-Type must be application/json" });
    return;
  }

  const { key, amount, orderId } = req.body;
  if (!key || !amount || !orderId) {
    res.status(400).json({ result: "INVALID_REQUEST", message: "Missing required fields: key, amount, orderId" });
    return;
  }

  try {
    if (await checkAmount(orderId, amount) === false) {
      res.json({ result: "UNMATCHED_AMOUNT", message: "결제 금액 불일치" });
      return;
    }

    const response = await approvePayment(key, amount, orderId);

    if (response.resultCode === '0000') {
      res.json({ result: "SUCCESS", message: "결제 승인 성공", response: response });
    } else {
      res.json({ result: "FAIL", message: "결제 승인 실패", response: response });
    }

    // DB 등 결제 승인 성공 로직을 여기에 추가하세요
    await postApprovePayments(key, amount, orderId);

  } catch (error) {
    console.error('결제 승인 중 오류 발생 망취소 처리:', error);
    await netcancelPayment(key, amount, orderId);

    res.json({ result: "ERROR", message: "결제 승인 중 오류 발생" });
  }
});

app.post('/cancel', async (req, res) => {
  const { mid, paymethod, tid, orderId, currency, cancelAmount, remainAmount, cancelType, amountTaxFree, amountVat } = req.body;

  if (!mid || !paymethod || !tid || !orderId || !currency || !cancelAmount
    || !remainAmount || !cancelType
    // || !amountTaxFree || !amountVat
  ) {
    res.status(400).json({ resultCode: "INVALID_REQUEST", resultMessage: "Missing required fields" });
    return;
  }

  try {
    const result = await cancelPayment(mid, paymethod, tid, orderId, currency, cancelAmount, remainAmount, cancelType, amountTaxFree, amountVat);
    if (result.resultCode === '0000') {
      res.json({ result: "SUCCESS", message: "취소 성공", response: response });
    } else {
      res.json({ resultCode: "CANCEL_FAIL", ...result });
    }
  } catch (error) {
    res.json({ resultCode: "CANCEL_ERROR", resultMessage: error.message });
  }
})
// app.post('/netcancel', async (req, res) => {
//   const { key, amount } = req.body;
//   try {
//     const result = await netcancelPayment(key, amount);
//     res.json({ resultCode: "0000", ...result });
//   } catch (error) {
//     res.status(500).json({ resultCode: "5000", resultMessage: error.message });
//   }
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});