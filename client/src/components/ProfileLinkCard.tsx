"use client";

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileLinkCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
}

export const ProfileLinkCard = ({ to, icon: Icon, title }: ProfileLinkCardProps) => (
  <Link to={to} className="block">
    <Card className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Icon className="w-6 h-6 text-secondary" />
          <span className="font-semibold">{title}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </CardContent>
    </Card>
  </Link>
);