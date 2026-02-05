import { motion } from 'framer-motion';
import './CategoryFilter.css';

function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter">
      {categories.map((category) => (
        <motion.button
          key={category}
          className={`category-chip ${selected === category ? 'active' : ''}`}
          onClick={() => onSelect(category)}
          whileTap={{ scale: 0.95 }}
        >
          {category === 'all' ? '전체' : category}
        </motion.button>
      ))}
    </div>
  );
}

export default CategoryFilter;
