// cloudfunctions/fixData/index.js
// 修复数据库字段，使其与前端模板匹配
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 修复 Banners
async function fixBanners() {
  const { data } = await db.collection("banners").get();
  
  for (const item of data) {
    // 只修复字段缺失的数据
    if (!item.img && item.image) {
      await db.collection("banners").doc(item._id).update({
        data: {
          img: item.image,
        },
      });
    }
    if (!item.badge) {
      await db.collection("banners").doc(item._id).update({
        data: {
          badge: "热门",
          cta: "立即体验",
        },
      });
    }
    if (!item.sub && item.subtitle) {
      await db.collection("banners").doc(item._id).update({
        data: {
          sub: item.subtitle,
        },
      });
    }
  }
  console.log(`修复了 ${data.length} 条 Banner 数据`);
}

// 修复 SellingPoints
async function fixSellingPoints() {
  const { data } = await db.collection("sellingPoints").get();
  
  const colors = [
    { color: "#FFB6C1", bg: "#FFF0F3" },
    { color: "#A8D8EA", bg: "#F0F9FF" },
    { color: "#FFD93D", bg: "#FFFBEB" },
  ];
  const icons = ["headphones", "book", "zap"];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const updates = {};
    
    // 转换 emoji 图标为标识符
    if (item.icon === "📚") updates.icon = "headphones";
    else if (item.icon === "🎙") updates.icon = "book";
    else if (item.icon === "👨‍🏫") updates.icon = "zap";
    
    if (!item.color) updates.color = colors[i % 3].color;
    if (!item.bg) updates.bg = colors[i % 3].bg;
    
    if (Object.keys(updates).length > 0) {
      await db.collection("sellingPoints").doc(item._id).update({ data: updates });
    }
  }
  console.log(`修复了 ${data.length} 条 SellingPoints 数据`);
}

// 修复 Stats
async function fixStats() {
  const { data } = await db.collection("stats").get();
  
  for (const item of data) {
    const updates = {};
    
    if (!item.display && item.value) {
      // 移除数字中的逗号和单位
      const num = item.value.replace(/,/g, '').replace(/[^\d.]/g, '');
      updates.display = num;
    }
    if (!item.suffix && item.value) {
      // 提取单位
      const match = item.value.match(/[^\d,.]+(?:\*\*|$)/);
      if (match) {
        updates.suffix = match[0].replace(/\*\*/g, '').trim() || '%';
      } else if (item.value.includes('%')) {
        updates.suffix = '%';
      } else if (item.value.includes('人')) {
        updates.suffix = '人';
      } else if (item.value.includes('次')) {
        updates.suffix = '次';
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await db.collection("stats").doc(item._id).update({ data: updates });
    }
  }
  console.log(`修复了 ${data.length} 条 Stats 数据`);
}

// 修复 Reviews
async function fixReviews() {
  const { data } = await db.collection("reviews").get();
  
  for (const item of data) {
    const updates = {};
    
    if (!item.text && item.content) {
      updates.text = item.content;
    }
    if (!item.days) {
      updates.days = Math.floor(Math.random() * 15) + 7;
    }
    
    if (Object.keys(updates).length > 0) {
      await db.collection("reviews").doc(item._id).update({ data: updates });
    }
  }
  console.log(`修复了 ${data.length} 条 Reviews 数据`);
}

// 主入口
exports.main = async (event, context) => {
  try {
    console.log("开始修复数据字段...");
    
    await fixBanners();
    await fixSellingPoints();
    await fixStats();
    await fixReviews();
    // 课程数据使用 lecture 表，不再修复 courses 表
    
    return {
      success: true,
      message: "数据字段修复完成",
    };
  } catch (err) {
    console.error("修复失败:", err);
    return {
      success: false,
      error: err.message,
    };
  }
};
