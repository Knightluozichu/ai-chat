import { useState } from 'react';
import { Plus, Loader2, Edit2, Trash2, GripVertical } from 'lucide-react';
import { usePracticeManagementStore } from '../../../store/practiceManagementStore';
import CategoryForm from './CategoryForm';
import type { Category } from '../../../types/practice';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategorySectionProps {
  onCategorySelect: (categoryId: number) => void;
}

const CategorySection = ({ onCategorySelect }: CategorySectionProps) => {
  const { categories, loadingCategories, createCategory, deleteCategory, updateCategoryOrder } = usePracticeManagementStore();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loadingCategories) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      try {
        await updateCategoryOrder(active.id as number, newIndex);
      } catch (error) {
        console.error('更新分类顺序失败:', error);
      }
    }
    
    setActiveId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const SortableItem = ({ category }: { category: Category }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: category.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${
          isDragging ? 'border-2 border-blue-500' : ''
        }`}
      >
        <div className="flex items-center space-x-4 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none p-1"
            aria-label="拖拽排序"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <button
            className="flex-1 text-left hover:text-blue-500 dark:hover:text-blue-400"
            onClick={() => onCategorySelect(category.id)}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {category.name}
            </span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {category.questions_count || 0} 题
            </span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingCategory(category)}
              className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              aria-label={`编辑分类 ${category.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsConfirmingDelete(category.id)}
              className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              aria-label={`删除分类 ${category.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId);
      setIsConfirmingDelete(null);
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  };

  const DeleteConfirmDialog = ({ categoryId }: { categoryId: number }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          确认删除
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          确定要删除这个分类吗？该操作无法撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
            onClick={() => setIsConfirmingDelete(null)}
          >
            取消
          </button>
          <button
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            onClick={() => handleDelete(categoryId)}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            分类管理
          </h2>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加分类
          </button>
        </div>

        {/* 分类列表 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(cat => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {categories.map((category) => (
                <SortableItem key={category.id} category={category} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* 添加/编辑分类表单 */}
        {(isAddingCategory || editingCategory) && (
          <CategoryForm
            category={editingCategory || undefined}
            onClose={() => {
              setIsAddingCategory(false);
              setEditingCategory(null);
            }}
          />
        )}

        {/* 删除确认对话框 */}
        {isConfirmingDelete && (
          <DeleteConfirmDialog categoryId={isConfirmingDelete} />
        )}
      </div>
    </div>
  );
};

export default CategorySection;