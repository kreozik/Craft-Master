import './styles.css';
import { startAdminRouter } from './router';

const root = document.getElementById('admin-root');
if (root) {
  startAdminRouter(root);
} else {
  console.error('Element #admin-root not found');
}
