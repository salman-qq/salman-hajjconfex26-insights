/**
 * نقطة الدخول الوحيدة للموقع (ES Module).
 * تعمل في المتصفح فقط؛ المنطق القابل للاختبار يعيش في وحدات مستقلة لا تلمس DOM.
 */
import { createAppController } from './app-controller.js';

const app = createAppController();
app.start(document);

