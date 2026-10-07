const express = require('express');
const axios = require('axios'); // npm install axios 필요
const app = express();
const PORT = process.env.PORT || 3000;

// AppSheet API 설정
const APPSHEET_APP_ID = "af15afd1-f6e6-4366-bf1e-42bab5c122b4";
const APPSHEET_ACCESS_KEY = "여기에_발급받은_AppSheet_Access_Key_입력";

app.get('/postcode', async (req, res) => {
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

                // 서버로 주소 업데이트 요청 전송
                fetch('/update-address', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tableName: "${tableName || ''}",
                        rowId: "${rowId || ''}",
                        zonecode: zonecode,
                        roadAddress: roadAddress
                    })
                }).then(() => {
                    // DB 직접 업데이트 후 AppSheet 해당 행의 상세화면/수정화면으로 이동
                    const redirectUrl = "https://www.appsheet.com/start/${APPSHEET_APP_ID}" +
                        "#control=${tableName || ''}_Detail" +
                        "&row=" + encodeURIComponent("${rowId || ''}");
                    window.location.href = redirectUrl;
                });
            },
            width : '100%',
            height : '100%'
        }).embed(document.getElementById('layer'));
    </script>
</body>
</html>
  `;

  res.send(htmlContent);
});

// AppSheet DB 직접 수정 API 라우트
app.use(express.json());
app.post('/update-address', async (req, res) => {
  const { tableName, rowId, zonecode, roadAddress } = req.body;

  if (rowId && tableName) {
    try {
      await axios.post(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`, {
        Action: "Edit",
        Properties: { Locale: "ko-KR" },
        Rows: [
          {
            "Key컬럼명": rowId, // Person_Master의 Key 컬럼 이름으로 변경 (예: ID)
            "우편번호": zonecode,
            "도로명주소": roadAddress
          }
        ]
      }, {
        headers: { ApplicationAccessKey: APPSHEET_ACCESS_KEY }
      });
    } catch (err) {
      console.error(err);
    }
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
