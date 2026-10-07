const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/postcode', (req, res) => {
  const { appId, appName, tableName, rowId } = req.query;

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
        const appId = "${appId || ''}";
        const appName = "${appName || ''}";
        const tableName = "${tableName || ''}";
        const rowId = "${rowId || ''}";

        new daum.Postcode({
            oncomplete: function(data) {
                const zonecode = data.zonecode;
                const roadAddress = data.roadAddress;

                if (tableName) {
                    const defaults = encodeURIComponent(JSON.stringify({
                        "우편번호": zonecode,
                        "도로명주소": roadAddress
                    }));
                    
                    const targetApp = appId || encodeURIComponent(appName);
                    
                    // rowId가 있으면 기존 데이터 수정(Edit), 없으면 신규 작성
                    let redirectUrl = "https://www.appsheet.com/start/" + targetApp +
                        "#control=" + encodeURIComponent(tableName + "_Form") +
                        "&defaults=" + defaults;

                    if (rowId) {
                        redirectUrl += "&row=" + encodeURIComponent(rowId);
                    }

                    window.location.href = redirectUrl;
                } else {
                    alert("우편번호: " + zonecode + "\\n도로명주소: " + roadAddress);
                }
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

app.listen(PORT, () => {
  console.log(`Address server running on port ${PORT}`);
});
