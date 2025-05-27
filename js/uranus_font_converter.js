// 将Uranus字体转换为Three.js可用的JSON格式
// 需要在Node.js环境中运行

const fs = require('fs');
const opentype = require('opentype.js');
const path = require('path');

// 字体路径
const fontPath = path.join(__dirname, '../fonts/Uranus_Pixel_11Px.ttf');

// 输出路径
const outputPath = path.join(__dirname, '../fonts/uranus_font.json');

// 加载字体
opentype.load(fontPath, (err, font) => {
    if (err) {
        console.error('无法加载字体:', err);
        return;
    }

    // 提取字体数据
    const fontData = {
        glyphs: {},
        familyName: font.names.fontFamily.en,
        ascender: font.ascender,
        descender: font.descender,
        underlinePosition: font.tables.post.underlinePosition,
        underlineThickness: font.tables.post.underlineThickness,
        boundingBox: {
            yMin: font.tables.head.yMin,
            xMin: font.tables.head.xMin,
            yMax: font.tables.head.yMax,
            xMax: font.tables.head.xMax
        },
        resolution: 1000,
        original_font_information: {
            format: font.outlinesFormat,
            copyright: font.names.copyright ? font.names.copyright.en : '',
            fontFamily: font.names.fontFamily.en,
            fontSubfamily: font.names.fontSubfamily ? font.names.fontSubfamily.en : '',
            uniqueID: font.names.uniqueID ? font.names.uniqueID.en : '',
            fullName: font.names.fullName ? font.names.fullName.en : '',
            version: font.names.version ? font.names.version.en : '',
            postScriptName: font.names.postScriptName ? font.names.postScriptName.en : ''
        }
    };

    // 处理字形
    const glyphs = font.glyphs.glyphs;
    for (const key in glyphs) {
        if (glyphs.hasOwnProperty(key)) {
            const glyph = glyphs[key];
            
            // 跳过空字形
            if (!glyph.name) continue;
            
            // 提取轮廓数据
            const path = glyph.getPath(0, 0, 1000);
            const pathData = path.toPathData(5);
            
            // 存储字形数据
            fontData.glyphs[glyph.unicode] = {
                ha: glyph.advanceWidth,
                x_min: glyph.xMin || 0,
                x_max: glyph.xMax || 0,
                o: pathData
            };
        }
    }

    // 写入JSON文件
    fs.writeFileSync(outputPath, JSON.stringify(fontData));
    console.log('字体转换完成，已保存到:', outputPath);
});
