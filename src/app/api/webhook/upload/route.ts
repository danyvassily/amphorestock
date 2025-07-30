import { NextRequest, NextResponse } from 'next/server';
import { ImportAIService } from '@/lib/importAIService';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token d\'authentification manquant' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Récupération des données du webhook
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validation des types de fichiers
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    const validFiles = files.filter(file => validTypes.includes(file.type));
    if (validFiles.length !== files.length) {
      console.warn(`${files.length - validFiles.length} fichier(s) ignoré(s) - type non supporté`);
    }

    // Traitement automatique avec IA
    const result = await ImportAIService.processAndImportDirectly(
      validFiles,
      userId,
      metadata.minConfidence || 80,
      (step, progress) => {
        console.log(`Webhook processing: ${step} - ${progress}%`);
      }
    );

    // Log de l'activité
    console.log(`Webhook import completed for user ${userId}:`, {
      filesCount: validFiles.length,
      success: result.success,
      addedCount: result.addedCount,
      updatedCount: result.updatedCount,
      importId: result.importId
    });

    return NextResponse.json({
      success: result.success,
      message: `Import traité: ${result.addedCount} ajoutés, ${result.updatedCount} mis à jour`,
      data: {
        importId: result.importId,
        addedCount: result.addedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        filesProcessed: validFiles.length
      }
    });

  } catch (error) {
    console.error('Erreur webhook upload:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement du webhook',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook upload endpoint ready',
    supportedFormats: ['CSV', 'Excel', 'Word', 'TXT', 'PDF', 'Images'],
    maxFileSize: '10MB per file'
  });
}