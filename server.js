const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const APPSHEET_APP_ID = "af15afd1-f6e6-4366-bf1e-42bab5c122b4";
const APPSHEET_ACCESS_KEY = "V2-tOZEG-FrqgF-6yxwM-8j9Xw-mzCpO-G8cuH-7ghgx-afHse";

app.get('/postcode', (req, res) => {
  const { tableName, rowId } = req.query;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카카오 주소 검색</title>
    <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
</head>
<body style="margin:0; padding:0;">
    <div id="layer" style="width:100vw; height:100vh;"></div>

    <script>
        new daum.Postcode({
            oncomplete: function(data) {
                const zonecode = data.zonecode;
                const roadAddress = data.roadAddress;
                const rowId = "${rowId || ''}";
                const tableName = "${tableName || ''}";

                if (rowId) {
                    // 기존 데이터 수정: API 호출 후 Detail 뷰로 이동
                    fetch('/update-address', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tableName, rowId, zonecode, roadAddress })
                    }).then(() => {
                        window.location.href = "https://www.appsheet.com/start/${APPSHEET_APP_ID}#control=" + tableName + "_Detail&row=" + encodeURIComponent(rowId);
                    });
                } else {
                    // 신규 작성: 기존 defaults 방식 유지
                    const defaults = encodeURIComponent(JSON.stringify({
                        "우편번호": zonecode,
                        "도로명주소": roadAddress
                    }));
                    window.location.href = "https://www.appsheet.com/start/${APPSHEET_APP_ID}#control=" + tableName + "_Form&defaults=" + defaults;
                }
            },
            width : '100%', height : '100%'
        }).embed(document.getElementById('layer'));
    </script>
</body>
</html>
  `;
  res.send(htmlContent);
});

// AppSheet DB 직접 업데이트 API
app.post('/update-address', async (req, res) => {
  const { tableName, rowId, zonecode, roadAddress } = req.body;
  try {
    await axios.post(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`, {
      Action: "Edit",
      Properties: { Locale: "ko-KR" },
      Rows: [{
        "개인ID": rowId, // ★ Person_Master의 실제 Key 컬럼명으로 수정 필수
        "우편번호": zonecode,
        "도로명주소": roadAddress
      }]
    }, {
      headers: { ApplicationAccessKey: APPSHEET_ACCESS_KEY }
    });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
