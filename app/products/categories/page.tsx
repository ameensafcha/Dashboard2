'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions/product/actions';
import { ProductCategoryType } from '@/app/actions/product/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/PageHeader';

function truncateWords(text: string, wordCount: number = 5) {
  if (!text) return '-';
  const words = text.split(' ');
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
}

export default function CategoriesPage() {
  const urlSearchParams = useSearchParams();
  const urlSearch = urlSearchParams.get('search') || undefined;

  const [categories, setCategories] = useState<ProductCategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<ProductCategoryType | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategoryType | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories(urlSearch);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [urlSearch]);

  const handleOpenModal = (category?: ProductCategoryType) => {
    if (category) {
      setEditingCategory(category);
      setNewCategory({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setNewCategory({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  const handleViewCategory = (category: ProductCategoryType) => {
    setViewingCategory(category);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    if (!newCategory.name) return;

    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: newCategory.name,
          description: newCategory.description || null,
        });
        toast({ title: 'Success', description: 'Category updated successfully', type: 'success' });
      } else {
        await createCategory({
          name: newCategory.name,
          description: newCategory.description || null,
        });
        toast({ title: 'Success', description: 'Category added successfully', type: 'success' });
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ title: 'Error', description: 'Failed to save category', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Categories" />

      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--muted)' }}>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>No categories yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add your first category to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--muted)' }}>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow
                  key={category.id}
                  style={{ background: 'var(--card)', cursor: 'pointer' }}
                  onClick={() => handleViewCategory(category)}
                  className="hover:bg-[var(--muted)] transition-colors"
                >
                  <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>{category.name}</TableCell>
                  <TableCell style={{ color: 'var(--text-muted)' }}>{truncateWords(category.description || '')}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(category); }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Category Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Description</p>
            <p style={{ color: 'var(--foreground)' }}>{viewingCategory?.description || '-'}</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingCategory ?? undefined); }}
              className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Pure Safcha"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Category description"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !newCategory.name}
                className="bg-[#E8A838] hover:bg-[#d49a2d] text-black"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
