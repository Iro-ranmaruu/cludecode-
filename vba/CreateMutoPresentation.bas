Option Explicit

'====================================================================
' 株式会社ムトウ 企業説明資料 - PowerPoint 自動生成マクロ
' 使い方:
'   1. PowerPoint を開き Alt+F11 で VBE を開く
'   2. 挿入 > 標準モジュール でこのコードを丸ごと貼り付け
'   3. カーソルを CreateMutoPresentation に置いて F5 で実行
'      (新規プレゼンテーションが自動生成されます)
'====================================================================

Private clrPrimary As Long
Private clrCyan As Long
Private clrDarkBlue As Long
Private clrTextDark As Long
Private clrLightText As Long
Private clrCardBg As Long
Private clrCardBg2 As Long
Private clrBorder As Long
Private clrBadgeBg As Long
Private clrWhite As Long
Private clrBgTop As Long
Private clrBgBottom As Long

Private Sub InitColors()
    clrPrimary = RGB(64, 99, 195)     ' #4063C3
    clrCyan = RGB(71, 160, 202)       ' #47A0CA
    clrDarkBlue = RGB(53, 91, 176)    ' #355BB0
    clrTextDark = RGB(18, 24, 38)     ' #121826
    clrLightText = RGB(234, 242, 255) ' #EAF2FF
    clrCardBg = RGB(243, 247, 255)    ' #F3F7FF
    clrCardBg2 = RGB(238, 246, 255)   ' #EEF6FF
    clrBorder = RGB(220, 231, 251)    ' #DCE7FB
    clrBadgeBg = RGB(234, 242, 255)   ' #EAF2FF
    clrWhite = RGB(255, 255, 255)
    clrBgTop = RGB(22, 34, 80)
    clrBgBottom = RGB(52, 80, 170)
End Sub

'--------------------------------------------------------------------
' メインエントリーポイント
'--------------------------------------------------------------------
Sub CreateMutoPresentation()

    Dim pres As Presentation

    InitColors

    Set pres = Application.Presentations.Add(msoTrue)
    pres.PageSetup.SlideWidth = 960   ' 13.33in x 7.5in (16:9)
    pres.PageSetup.SlideHeight = 540

    BuildSlide1 pres
    BuildSlide2 pres
    BuildSlide3 pres
    BuildSlide4 pres
    BuildSlide5 pres

    MsgBox "株式会社ムトウ 企業説明資料（5枚）を作成しました。", vbInformation

End Sub

'====================================================================
' 共通ヘルパー関数
'====================================================================

Private Function NewSlide(pres As Presentation) As Slide
    Dim sld As Slide
    Set sld = pres.Slides.Add(pres.Slides.Count + 1, ppLayoutBlank)
    SetBackground sld
    Set NewSlide = sld
End Function

Private Sub SetBackground(sld As Slide)
    sld.FollowMasterBackground = msoFalse
    With sld.Background.Fill
        .Visible = msoTrue
        .ForeColor.RGB = clrBgTop
        .BackColor.RGB = clrBgBottom
        .TwoColorGradient msoGradientDiagonalDown, 1
    End With
End Sub

' 白背景の角丸カード（影付き）
Private Function AddCard(sld As Slide, l As Single, t As Single, w As Single, h As Single, _
    Optional radius As Single = 0.06, Optional withShadow As Boolean = True) As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, l, t, w, h)
    On Error Resume Next
    shp.Adjustments.Item(1) = radius
    On Error GoTo 0
    shp.Fill.ForeColor.RGB = clrWhite
    shp.Line.ForeColor.RGB = clrBorder
    shp.Line.Weight = 1
    If withShadow Then
        shp.Shadow.Visible = msoTrue
        shp.Shadow.Type = msoShadow21
        shp.Shadow.ForeColor.RGB = RGB(20, 30, 70)
        shp.Shadow.Transparency = 0.75
        shp.Shadow.OffsetX = 0
        shp.Shadow.OffsetY = 3
    Else
        shp.Shadow.Visible = msoFalse
    End If
    Set AddCard = shp
End Function

' 色つき角丸ボックス（カード内側の強調ブロックなど）
Private Function AddFillBox(sld As Slide, l As Single, t As Single, w As Single, h As Single, _
    fillClr As Long, Optional radius As Single = 0.12, Optional lineClr As Long = -1) As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, l, t, w, h)
    On Error Resume Next
    shp.Adjustments.Item(1) = radius
    On Error GoTo 0
    shp.Fill.ForeColor.RGB = fillClr
    If lineClr = -1 Then
        shp.Line.Visible = msoFalse
    Else
        shp.Line.ForeColor.RGB = lineClr
        shp.Line.Weight = 1
    End If
    shp.Shadow.Visible = msoFalse
    Set AddFillBox = shp
End Function

' 左側に太いアクセント線をつけたボックス（border-left-4 の再現）
Private Function AddLeftBorderBox(sld As Slide, l As Single, t As Single, w As Single, h As Single, _
    fillClr As Long, borderClr As Long) As Shape
    Dim shp As Shape, ln As Shape
    Set shp = AddFillBox(sld, l, t, w, h, fillClr, 0.06)
    Set ln = sld.Shapes.AddShape(msoShapeRectangle, l, t, 4, h)
    ln.Fill.ForeColor.RGB = borderClr
    ln.Line.Visible = msoFalse
    ln.Shadow.Visible = msoFalse
    Set AddLeftBorderBox = shp
End Function

' ピル型バッジ（塗りつぶし or 枠線のみ）
Private Function AddPill(sld As Slide, l As Single, t As Single, w As Single, h As Single, _
    txt As String, fillClr As Long, txtClr As Long, Optional fSize As Single = 10, _
    Optional outlineOnly As Boolean = False) As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, l, t, w, h)
    On Error Resume Next
    shp.Adjustments.Item(1) = 0.5
    On Error GoTo 0
    If outlineOnly Then
        shp.Fill.Visible = msoFalse
        shp.Line.ForeColor.RGB = txtClr
        shp.Line.Weight = 1
    Else
        shp.Fill.ForeColor.RGB = fillClr
        shp.Line.Visible = msoFalse
    End If
    shp.Shadow.Visible = msoFalse
    With shp.TextFrame
        .WordWrap = msoFalse
        .VerticalAnchor = msoAnchorMiddle
        .MarginLeft = 4: .MarginRight = 4: .MarginTop = 0: .MarginBottom = 0
        With .TextRange
            .Text = txt
            .Font.Size = fSize
            .Font.Bold = msoTrue
            .Font.Color.RGB = txtClr
            .Font.Name = "Yu Gothic UI"
            .ParagraphFormat.Alignment = ppAlignCenter
        End With
    End With
    Set AddPill = shp
End Function

' 円形の番号バッジ
Private Function AddCircle(sld As Slide, l As Single, t As Single, d As Single, _
    fillClr As Long, txt As String, txtClr As Long, Optional fSize As Single = 14) As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddShape(msoShapeOval, l, t, d, d)
    shp.Fill.ForeColor.RGB = fillClr
    shp.Line.Visible = msoFalse
    shp.Shadow.Visible = msoFalse
    With shp.TextFrame
        .VerticalAnchor = msoAnchorMiddle
        .MarginLeft = 0: .MarginRight = 0: .MarginTop = 0: .MarginBottom = 0
        With .TextRange
            .Text = txt
            .Font.Size = fSize
            .Font.Bold = msoTrue
            .Font.Color.RGB = txtClr
            .Font.Name = "Yu Gothic UI"
            .ParagraphFormat.Alignment = ppAlignCenter
        End With
    End With
    Set AddCircle = shp
End Function

' テキストボックス
Private Function AddLabel(sld As Slide, l As Single, t As Single, w As Single, h As Single, _
    txt As String, fSize As Single, clr As Long, Optional bold As Boolean = False, _
    Optional align As Long = 1, Optional fontName As String = "Yu Gothic UI") As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, l, t, w, h)
    With shp.TextFrame
        .WordWrap = msoTrue
        .AutoSize = ppAutoSizeNone
        .MarginLeft = 0: .MarginRight = 0: .MarginTop = 0: .MarginBottom = 0
        With .TextRange
            .Text = txt
            .Font.Size = fSize
            .Font.Bold = bold
            .Font.Color.RGB = clr
            .Font.Name = fontName
            .ParagraphFormat.Alignment = align
        End With
    End With
    Set AddLabel = shp
End Function

' 縦の小さいアクセントバー（見出し横の装飾）
Private Function AddBar(sld As Slide, l As Single, t As Single, w As Single, h As Single, clr As Long) As Shape
    Dim shp As Shape
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, l, t, w, h)
    On Error Resume Next
    shp.Adjustments.Item(1) = 0.5
    On Error GoTo 0
    shp.Fill.ForeColor.RGB = clr
    shp.Line.Visible = msoFalse
    shp.Shadow.Visible = msoFalse
    Set AddBar = shp
End Function

' 共通ヘッダー（バッジ番号 + 英語ラベル + タイトル + サブタイトル）
Private Sub AddHeader(sld As Slide, num As String, enLabel As String, jaTitle As String, subtitle As String)
    AddPill sld, 40, 40, 46, 24, num, clrPrimary, clrWhite, 12
    AddLabel sld, 96, 42, 600, 22, enLabel, 10.5, clrLightText, True
    AddLabel sld, 40, 66, 880, 48, jaTitle, 26, clrWhite, True
    AddLabel sld, 40, 116, 880, 28, subtitle, 13, clrLightText
End Sub

' 共通フッター
Private Sub AddFooter(sld As Slide, pageNum As Integer)
    Dim ln As Shape
    Set ln = sld.Shapes.AddLine(40, 503, 920, 503)
    ln.Line.ForeColor.RGB = clrLightText
    ln.Line.Transparency = 0.7
    ln.Line.Weight = 1
    AddLabel sld, 40, 510, 400, 20, "株式会社ムトウ | 企業説明資料", 10, clrLightText
    AddLabel sld, 880, 510, 40, 20, CStr(pageNum), 10, clrLightText, False, ppAlignRight
End Sub

'====================================================================
' スライド 1: 表紙 + アジェンダ
'====================================================================
Private Sub BuildSlide1(pres As Presentation)
    Dim sld As Slide
    Set sld = NewSlide(pres)

    ' --- 左カラム ---
    AddPill sld, 40, 56, 132, 26, "会社紹介資料", clrWhite, clrPrimary, 10.5
    AddPill sld, 182, 56, 190, 26, "対象：大学生・就職活動生", clrWhite, clrLightText, 10.5, True

    AddLabel sld, 40, 96, 350, 120, "株式会社ムトウ" & vbCrLf & "企業説明資料", 30, clrWhite, True
    AddLabel sld, 40, 224, 350, 40, "人々の健康と命を陰から支える医療総合商社", 15, clrLightText

    AddCard sld, 40, 272, 350, 180
    AddBar sld, 58, 288, 8, 20, clrPrimary
    AddLabel sld, 74, 286, 300, 24, "本日の目的", 15, clrPrimary, True
    AddLabel sld, 58, 318, 316, 120, _
        "株式会社ムトウの事業内容、医療商社としての強み、そしてやりがいに満ちた働く環境について分かりやすくご紹介します。", _
        12.5, clrTextDark

    ' --- 右カラム: アジェンダカード ---
    AddCard sld, 430, 55, 490, 425
    AddBar sld, 448, 76, 8, 26, clrPrimary
    AddLabel sld, 464, 76, 300, 28, "本日のアジェンダ", 19, clrTextDark, True
    AddPill sld, 828, 78, 80, 26, "AGENDA", clrBadgeBg, clrPrimary, 10.5

    Dim ln As Shape
    Set ln = sld.Shapes.AddLine(448, 116, 900, 116)
    ln.Line.ForeColor.RGB = clrBorder
    ln.Line.Weight = 1

    Dim itemY As Single, i As Integer
    Dim titles(1 To 4) As String, subs(1 To 4) As String
    titles(1) = "会社概要・企業理念": subs(1) = "医療現場を支える役割と社会貢献"
    titles(2) = "事業内容と３つの強み": subs(2) = "高度医療から研究分野までをカバー"
    titles(3) = "働く環境・やりがい": subs(3) = "手厚い研修体制とチーム連携の魅力"
    titles(4) = "求める人物像・選考案内": subs(4) = "成長できる環境と次のステップへのご案内"

    itemY = 130
    For i = 1 To 4
        AddFillBox sld, 448, itemY, 460, 78, clrCardBg, 0.1
        AddCircle sld, 462, itemY + 14, 50, clrPrimary, "0" & i, clrWhite, 17
        AddLabel sld, 524, itemY + 12, 372, 26, titles(i), 15.5, clrTextDark, True
        AddLabel sld, 524, itemY + 40, 372, 24, subs(i), 11.5, clrPrimary, True
        itemY = itemY + 88
    Next i

    AddFooter sld, 1
End Sub

'====================================================================
' スライド 2: 会社概要・企業理念
'====================================================================
Private Sub BuildSlide2(pres As Presentation)
    Dim sld As Slide
    Set sld = NewSlide(pres)

    AddHeader sld, "01", "COMPANY OVERVIEW & PHILOSOPHY", "会社概要・企業理念", _
        "医療現場のニーズに応え、社会の健康に貢献する専門商社"

    ' --- 左カラム ---
    AddCard sld, 40, 160, 340, 160
    AddBar sld, 56, 176, 8, 22, clrPrimary
    AddLabel sld, 72, 174, 280, 24, "企業理念", 16, clrPrimary, True
    AddLeftBorderBox sld, 56, 208, 308, 96, clrCardBg, clrPrimary
    AddLabel sld, 68, 220, 288, 76, "医療環境の最適化を通じて、" & vbCrLf & "地域社会と人々の健康増進に寄与する", 14, clrTextDark, True

    AddCard sld, 40, 335, 340, 160
    AddBar sld, 56, 351, 8, 22, clrCyan
    AddLabel sld, 72, 349, 280, 24, "会社概要", 16, clrTextDark, True
    AddLabel sld, 56, 385, 308, 100, _
        "医療機器や医療用消耗品の安定供給を通じ、最先端の医療現場と人々の命を支える医療総合商社です。", 13, clrTextDark

    ' --- 右カラム: 主な特徴 ---
    AddCard sld, 400, 160, 520, 335
    AddBar sld, 418, 176, 8, 26, clrPrimary
    AddLabel sld, 434, 176, 260, 26, "主な特徴", 18, clrTextDark, True
    AddPill sld, 758, 178, 142, 24, "KEY FEATURES", clrBadgeBg, clrPrimary, 10.5

    Dim ln As Shape
    Set ln = sld.Shapes.AddLine(418, 210, 900, 210)
    ln.Line.ForeColor.RGB = clrBorder
    ln.Line.Weight = 1

    AddFillBox sld, 418, 224, 486, 108, clrCardBg, 0.1
    AddCircle sld, 432, 236, 44, clrPrimary, "01", clrWhite, 15
    AddLabel sld, 486, 234, 404, 24, "全国網羅のネットワーク", 14.5, clrPrimary, True
    AddLabel sld, 486, 260, 404, 64, "全国を網羅する強力なネットワークを展開。医療機関と医療機器メーカーを高度かつスピーディーに接続します。", 12, clrTextDark

    AddFillBox sld, 418, 342, 486, 108, clrCardBg2, 0.1
    AddCircle sld, 432, 354, 44, clrCyan, "02", clrWhite, 15
    AddLabel sld, 486, 352, 404, 24, "ソリューション提供", 14.5, clrCyan, True
    AddLabel sld, 486, 378, 404, 64, "単なる物品供給にとどまらず、病院経営の課題解決や医療現場の効率化につながる総合的なソリューションを提供します。", 12, clrTextDark

    AddFillBox sld, 418, 462, 486, 26, clrBadgeBg, 0.3
    AddLabel sld, 434, 466, 456, 20, "現場のあらゆる課題に応え、地域医療の質向上を陰から支え続けています。", 11.5, clrPrimary, True

    AddFooter sld, 2
End Sub

'====================================================================
' スライド 3: 事業内容と３つの強み
'====================================================================
Private Sub BuildSlide3(pres As Presentation)
    Dim sld As Slide
    Set sld = NewSlide(pres)

    AddHeader sld, "02", "BUSINESS OPERATIONS & STRENGTHS", "事業内容と３つの強み", _
        "高度医療から研究分野までをカバーする多角的な事業展開"

    Dim colX(1 To 3) As Single
    colX(1) = 40: colX(2) = 340: colX(3) = 640
    Dim colW As Single: colW = 280

    Dim pillTxt(1 To 3) As String, iconClr(1 To 3) As Long, titleTxt(1 To 3) As String
    Dim bodyTxt(1 To 3) As String, footTxt(1 To 3) As String, footClr(1 To 3) As Long, footBg(1 To 3) As Long

    pillTxt(1) = "01 / MEDICAL": iconClr(1) = clrPrimary
    titleTxt(1) = "医療機器事業"
    bodyTxt(1) = "最先端の手術機器や検査装置の提案・納品・アフターフォローまでトータルにサポート。"
    footTxt(1) = "高度医療現場を最適化": footClr(1) = clrPrimary: footBg(1) = clrCardBg

    pillTxt(2) = "02 / LOGISTICS": iconClr(2) = clrCyan
    titleTxt(2) = "SPD事業（院内物流管理）"
    bodyTxt(2) = "病院内の医療材料・在庫管理を最適化し、医療従事者が診療に集中できる環境を強力に支援。"
    footTxt(2) = "病院経営と業務効率化": footClr(2) = clrCyan: footBg(2) = clrCardBg2

    pillTxt(3) = "03 / RESEARCH": iconClr(3) = clrDarkBlue
    titleTxt(3) = "理化学・研究用機器事業"
    bodyTxt(3) = "大学や研究機関向けに、専門性の高い先端研究機器や各種消耗品を幅広く提供。"
    footTxt(3) = "先端科学とイノベーション": footClr(3) = clrDarkBlue: footBg(3) = clrCardBg

    Dim i As Integer
    For i = 1 To 3
        AddCard sld, colX(i), 160, colW, 250
        AddPill sld, colX(i) + 16, 176, 150, 22, pillTxt(i), clrBadgeBg, clrPrimary, 10
        AddCircle sld, colX(i) + colW - 56, 174, 40, iconClr(i), "", clrWhite, 12
        AddLabel sld, colX(i) + 16, 210, colW - 32, 50, titleTxt(i), 15, clrTextDark, True
        AddLabel sld, colX(i) + 16, 262, colW - 32, 96, bodyTxt(i), 12.5, clrTextDark
        AddLeftBorderBox sld, colX(i) + 16, 366, colW - 32, 34, footBg(i), footClr(i)
        AddLabel sld, colX(i) + 28, 374, colW - 56, 20, footTxt(i), 11.5, footClr(i), True
    Next i

    ' --- 独自の強み ハイライトパネル ---
    AddCard sld, 40, 428, 880, 70
    AddFillBox sld, 56, 442, 56, 42, clrPrimary, 0.25
    AddLabel sld, 56, 450, 56, 26, "強み", 12, clrWhite, True, ppAlignCenter
    AddLabel sld, 124, 438, 200, 16, "OUR ADVANTAGE", 10, clrPrimary, True
    AddLabel sld, 124, 456, 200, 28, "独自の強み", 17, clrTextDark, True
    AddFillBox sld, 340, 442, 560, 42, clrCardBg, 0.2
    AddLabel sld, 356, 452, 528, 24, "豊富な製品ラインナップ と 専門知識に基づく高い提案力", 14, clrPrimary, True

    AddFooter sld, 3
End Sub

'====================================================================
' スライド 4: 働く環境とやりがい
'====================================================================
Private Sub BuildSlide4(pres As Presentation)
    Dim sld As Slide
    Set sld = NewSlide(pres)

    AddHeader sld, "03", "WORKING ENVIRONMENT & VALUES", "働く環境とやりがい", _
        "専門性を高め、チームで医療の未来を支える仕事"

    Dim colX(1 To 2) As Single, rowY(1 To 2) As Single
    colX(1) = 40: colX(2) = 490
    rowY(1) = 160: rowY(2) = 337
    Dim cW As Single: cW = 430
    Dim cH As Single: cH = 157

    Dim pillTxt(1 To 4) As String, iconClr(1 To 4) As Long, badgeBg(1 To 4) As Long
    Dim titleTxt(1 To 4) As String, bodyTxt(1 To 4) As String
    Dim footTxt(1 To 4) As String, footClr(1 To 4) As Long, footBg(1 To 4) As Long

    pillTxt(1) = "01 / CONTRIBUTION": iconClr(1) = clrPrimary: badgeBg(1) = clrBadgeBg
    titleTxt(1) = "社会的貢献度の高さ"
    bodyTxt(1) = "人々の命を守る医療現場のパートナーとして、社会に大きく貢献する強い実感と誇りを持って働くことができます。"
    footTxt(1) = "医療現場を直接支える大きな誇り": footClr(1) = clrPrimary: footBg(1) = clrCardBg

    pillTxt(2) = "02 / EDUCATION": iconClr(2) = clrCyan: badgeBg(2) = clrCardBg2
    titleTxt(2) = "充実した教育・研修体制"
    bodyTxt(2) = "医療知識ゼロからでも安心して着実に成長できるよう、手厚く段階的な研修カリキュラムを用意しています。"
    footTxt(2) = "未経験からプロフェッショナルへ": footClr(2) = clrCyan: footBg(2) = clrCardBg2

    pillTxt(3) = "03 / TEAMWORK": iconClr(3) = clrDarkBlue: badgeBg(3) = clrBadgeBg
    titleTxt(3) = "チームワーク重視の風土"
    bodyTxt(3) = "営業・SPDスタッフ・技術部門が一体となって強固に連携し、顧客からの厚い信頼を獲得しています。"
    footTxt(3) = "部門を超えた強力な連携シナジー": footClr(3) = clrDarkBlue: footBg(3) = clrCardBg

    pillTxt(4) = "04 / WORK-LIFE": iconClr(4) = clrCyan: badgeBg(4) = clrCardBg2
    titleTxt(4) = "働きやすい環境"
    bodyTxt(4) = "ワークライフバランスの推進と、長期的かつ安心して描けるキャリア形成の支援体制を整えています。"
    footTxt(4) = "安心と持続可能性のあるキャリア": footClr(4) = clrCyan: footBg(4) = clrCardBg2

    Dim i As Integer, cx As Single, cy As Single
    For i = 1 To 4
        If i <= 2 Then cy = rowY(1) Else cy = rowY(2)
        If i Mod 2 = 1 Then cx = colX(1) Else cx = colX(2)

        AddCard sld, cx, cy, cW, cH
        AddPill sld, cx + 16, cy + 14, 168, 20, pillTxt(i), badgeBg(i), iconClr(i), 9.5
        AddCircle sld, cx + cW - 56, cy + 12, 38, iconClr(i), "", clrWhite, 11
        AddLabel sld, cx + 16, cy + 44, cW - 32, 26, titleTxt(i), 15, clrTextDark, True
        AddLabel sld, cx + 16, cy + 72, cW - 32, 56, bodyTxt(i), 12, clrTextDark
        AddLeftBorderBox sld, cx + 16, cy + 128, cW - 32, 22, footBg(i), footClr(i)
        AddLabel sld, cx + 28, cy + 131, cW - 56, 18, footTxt(i), 10.5, footClr(i), True
    Next i

    AddFooter sld, 4
End Sub

'====================================================================
' スライド 5: 求める人物像・選考案内
'====================================================================
Private Sub BuildSlide5(pres As Presentation)
    Dim sld As Slide
    Set sld = NewSlide(pres)

    AddHeader sld, "04", "CANDIDATE PROFILE & SELECTION", "求める人物像・選考案内", _
        "医療の進化を支え、自ら成長し続けられる方を歓迎します"

    ' --- 左カラム: 求める人物像 ---
    AddBar sld, 40, 158, 8, 22, clrLightText
    AddLabel sld, 56, 156, 300, 26, "求める人物像", 17, clrWhite, True

    Dim labelTxt(1 To 3) As String, titleTxt(1 To 3) As String, bodyTxt(1 To 3) As String
    Dim accentClr(1 To 3) As Long

    labelTxt(1) = "PROACTIVE & SINCERE": accentClr(1) = clrPrimary
    titleTxt(1) = "主体的に考え、誠実に行動できる方"
    bodyTxt(1) = "自ら課題を見つけて解決に向けて積極的に動き、周囲に信頼される行動をとれる人材。"

    labelTxt(2) = "COMMUNICATION & TRUST": accentClr(2) = clrCyan
    titleTxt(2) = "人との対話を大切にし、信頼関係を築ける方"
    bodyTxt(2) = "医療従事者やパートナー企業と深い対話を通じ、長期的で強い絆を構築できる人材。"

    labelTxt(3) = "SOCIAL CONTRIBUTION": accentClr(3) = clrDarkBlue
    titleTxt(3) = "社会貢献性の高いビジネスに情熱を持てる方"
    bodyTxt(3) = "人の命と健康を支える医療ビジネスに責任感と情熱を持って向き合える人材。"

    Dim i As Integer, py As Single
    py = 194
    For i = 1 To 3
        AddCard sld, 40, py, 520, 100, 0.08, False
        AddFillBox sld, 56, py + 26, 48, 48, clrBadgeBg, 0.25
        AddLabel sld, 56, py + 38, 48, 26, "0" & i, 15, accentClr(i), True, ppAlignCenter
        AddLabel sld, 118, py + 12, 420, 16, labelTxt(i), 10, accentClr(i), True
        AddLabel sld, 118, py + 28, 420, 24, titleTxt(i), 14.5, clrTextDark, True
        AddLabel sld, 118, py + 54, 420, 40, bodyTxt(i), 11.5, clrTextDark
        py = py + 112
    Next i

    ' --- 右カラム: 次のステップ ---
    AddBar sld, 580, 158, 8, 22, RGB(180, 188, 247)
    AddLabel sld, 596, 156, 300, 26, "次のステップ", 17, clrWhite, True

    AddCard sld, 580, 192, 340, 305
    AddPill sld, 596, 208, 176, 24, "ENTRY INFORMATION", clrPrimary, clrWhite, 10
    AddLabel sld, 596, 240, 308, 56, "インターンシップ・説明会" & vbCrLf & "エントリー受付中", 17, clrTextDark, True
    AddLabel sld, 596, 302, 308, 76, "医療商社の魅力や現場の仕事を体感できる各種イベントを開催しています。皆様のご参加を心よりお待ちしております。", 12, clrTextDark

    AddFillBox sld, 596, 388, 308, 68, clrCardBg, 0.1
    AddLabel sld, 610, 396, 280, 16, "MYPAGE GUIDE", 9.5, clrPrimary, True
    AddLabel sld, 610, 414, 280, 38, "詳細は当社【新卒採用マイページ】にて順次ご案内しております。", 12, clrTextDark, True

    Dim ln As Shape
    Set ln = sld.Shapes.AddLine(596, 468, 904, 468)
    ln.Line.ForeColor.RGB = clrBorder
    ln.Line.Weight = 1
    AddLabel sld, 596, 476, 250, 20, "まずはマイページへご登録ください", 11.5, clrPrimary, True
    AddCircle sld, 862, 470, 32, clrPrimary, Chr(62), clrWhite, 14

    AddFooter sld, 5
End Sub
