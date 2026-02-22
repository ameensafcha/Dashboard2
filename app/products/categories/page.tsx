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
import { useTranslation } from '@/lib/i18n';
import { Tag, FileText, Info } from 'lucide-react';

function truncateWords(text: string, wordCount: number = 5) {
  if (!text) return '-';
  const words = text.split(' ');
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
}

export function CategoriesContent() {
  const { t, isRTL } = useTranslation();
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
    if (!newCategory.name) {
      toast({ title: 'Error', description: t.nameRequired, type: 'error' });
      return;
    }

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
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader title={t.categories} />

      <div className="flex justify-end">
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2 font-medium shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t.addCategory}
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--muted)' }} className="hover:bg-transparent">
                <TableHead className="font-semibold text-[var(--text-primary)] py-4 px-6">{t.name}</TableHead>
                <TableHead className="font-semibold text-[var(--text-primary)] py-4">{t.categoryDescription}</TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-primary)] py-4 px-6">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <TableCell className="py-4 px-6"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="py-4 px-6 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/30" style={{ borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner" style={{ borderColor: 'var(--border)' }}>
            <Tag className="w-8 h-8 opacity-40 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">{t.noCategoriesYet}</h3>
          <p className="text-sm max-w-xs mx-auto text-[var(--text-secondary)]">{t.addFirstCategory}</p>
          <Button
            onClick={() => handleOpenModal()}
            variant="outline"
            className="mt-6 border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10"
          >
            {t.addCategory}
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--muted)' }} className="hover:bg-transparent">
                <TableHead className="font-semibold text-[var(--text-primary)] py-4 px-6">{t.name}</TableHead>
                <TableHead className="font-semibold text-[var(--text-primary)] py-4">{t.categoryDescription}</TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-primary)] py-4 px-6">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow
                  key={category.id}
                  style={{ background: 'var(--card)', cursor: 'pointer' }}
                  onClick={() => handleViewCategory(category)}
                  className="hover:bg-[var(--muted)] transition-colors border-b last:border-0"
                >
                  <TableCell className="font-medium py-4 px-6 text-[var(--text-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--primary)] border" style={{ borderColor: 'var(--border)' }}>
                        <Tag className="w-4 h-4" />
                      </div>
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-[var(--text-secondary)]">{truncateWords(category.description || '')}</TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(category); }}
                        className="p-2 rounded-lg transition-colors hover:bg-[var(--muted)] shadow-sm border"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--card)' }}
                        title={t.edit}
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
        <DialogContent className="max-w-md bg-[var(--card)] border-[var(--border)] overflow-hidden p-0 tabular-nums">
          <div className="p-6 pb-0">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                  <Info className="w-5 h-5" />
                </div>
                <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">{t.viewCategory}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] opacity-80 block mb-2">{t.name}</label>
                <p className="text-lg font-semibold bg-[var(--muted)] p-3 rounded-lg border text-[var(--text-primary)]" style={{ borderColor: 'var(--border)' }}>{viewingCategory?.name}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] opacity-80 block mb-2">{t.categoryDescription}</label>
                <div className="bg-[var(--muted)] p-4 rounded-lg border min-h-[100px]" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[var(--text-primary)] leading-relaxed">{viewingCategory?.description || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 bg-[var(--muted)]/50 mt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button
              onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingCategory ?? undefined); }}
              className="bg-[#E8A838] hover:bg-[#d49a2d] text-black gap-2 font-medium px-6"
            >
              <Edit className="w-4 h-4" />
              {t.edit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md bg-[var(--card)] border-[var(--border)] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 flex items-center justify-center text-[#E8A838] border border-[#E8A838]/20 shadow-sm">
                {editingCategory ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">{editingCategory ? t.editCategory : t.addCategory}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <Tag className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                {t.name} <span className="text-red-500">*</span>
              </label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Pure Safcha"
                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <FileText className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                {t.categoryDescription}
              </label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Write a brief description about this category..."
                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] min-h-[120px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 bg-[var(--muted)]/50 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="border-[var(--border)] hover:bg-[var(--card)] w-24 text-[var(--text-primary)]"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !newCategory.name}
              className="bg-[#E8A838] hover:bg-[#d49a2d] text-black font-semibold px-8 shadow-md transition-all active:scale-95"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </div>
              ) : t.saveChanges}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Suspense } from 'react';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Categories...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
