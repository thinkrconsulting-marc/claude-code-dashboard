export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData?.get?.('file') as File | null;
    const uploadId = formData?.get?.('uploadId') as string | null;
    if (!file || !uploadId) {
      return NextResponse.json({ error: 'Bestand en upload ID verplicht' }, { status: 400 });
    }

    let textContent = '';
    const fileType = file?.type ?? '';
    const fileName = file?.name ?? '';

    // Extract text content
    if (fileType === 'text/plain' || fileName?.endsWith?.('.txt') || fileName?.endsWith?.('.md')) {
      textContent = await file.text();
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName?.endsWith?.('.docx')) {
      try {
        const mammoth = require('mammoth');
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        textContent = result?.value ?? '';
      } catch (e: any) {
        console.error('DOCX extraction error:', e);
        return NextResponse.json({ error: 'Fout bij DOCX verwerking' }, { status: 500 });
      }
    } else if (fileType === 'application/pdf' || fileName?.endsWith?.('.pdf')) {
      // Use LLM API for PDF
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');
      const pdfResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64String}` } },
              { type: 'text', text: 'Extract all the text content from this PDF document. Return only the raw text, no formatting instructions.' },
            ],
          }],
          max_tokens: 4000,
        }),
      });
      if (!pdfResponse?.ok) {
        return NextResponse.json({ error: 'PDF extractie mislukt via AI' }, { status: 500 });
      }
      const pdfData = await pdfResponse.json();
      textContent = pdfData?.choices?.[0]?.message?.content ?? '';
    } else {
      return NextResponse.json({ error: 'Niet-ondersteund bestandstype' }, { status: 400 });
    }

    // Update the upload with extracted content
    await prisma.upload.update({
      where: { id: uploadId },
      data: { extractedContent: textContent?.slice?.(0, 50000) ?? '', status: 'PROCESSING' },
    });

    // Get existing chapters for context
    const chapters = await prisma.chapter.findMany({
      orderBy: { number: 'asc' },
      select: { id: true, title: true, number: true },
    });

    const chaptersContext = chapters?.map?.((c: any) => `${c?.number}. ${c?.title} (id: ${c?.id})`)?.join?.('\n') ?? '';

    // Now stream AI analysis
    const analysisResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Je bent een AI-assistent die content analyseert voor een Claude Code kennisbank. Analyseer de volgende tekst en geef een JSON-antwoord met je suggesties.\n\nBestaande hoofdstukken:\n${chaptersContext}\n\nTekst om te analyseren (eerste 3000 tekens):\n${textContent?.slice?.(0, 3000) ?? ''}\n\nGeef je antwoord in dit exacte JSON-formaat:\n{\n  "summary": "Korte samenvatting van de inhoud (2-3 zinnen)",\n  "suggestedChapterId": "het id van het meest relevante bestaande hoofdstuk, of null als het een nieuw hoofdstuk moet zijn",\n  "suggestedChapterTitle": "titel van het gesuggereerde hoofdstuk",\n  "suggestedSectionTitle": "titel voor een nieuwe sectie",\n  "suggestedTags": ["tag1", "tag2", "tag3"],\n  "contentType": "Skills | MCP Servers | Tips | Commando\'s | Configuratie | Workflow | Anders",\n  "confidence": 0.85\n}\n\nRespond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`,
        }],
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!analysisResponse?.ok) {
      return NextResponse.json({ error: 'AI analyse mislukt' }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = analysisResponse?.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines?.pop?.() ?? '';
            for (const line of (lines ?? [])) {
              if (line?.startsWith?.('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    await prisma.upload.update({
                      where: { id: uploadId },
                      data: {
                        aiSuggestion: JSON.stringify(finalResult),
                        suggestedChapter: finalResult?.suggestedChapterTitle ?? null,
                        suggestedSection: finalResult?.suggestedSectionTitle ?? null,
                        suggestedTags: finalResult?.suggestedTags ?? [],
                        status: 'REVIEWED',
                      },
                    });
                    const finalData = JSON.stringify({ status: 'completed', result: finalResult });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (e: any) {
                    const errData = JSON.stringify({ status: 'error', message: 'JSON parse fout in AI antwoord' });
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  const progressData = JSON.stringify({ status: 'processing', message: 'AI analyseert content...' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch {}
              }
            }
          }
          // Handle case where buffer has content but no [DONE]
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              await prisma.upload.update({
                where: { id: uploadId },
                data: {
                  aiSuggestion: JSON.stringify(finalResult),
                  suggestedChapter: finalResult?.suggestedChapterTitle ?? null,
                  suggestedSection: finalResult?.suggestedSectionTitle ?? null,
                  suggestedTags: finalResult?.suggestedTags ?? [],
                  status: 'REVIEWED',
                },
              });
              const finalData = JSON.stringify({ status: 'completed', result: finalResult });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch {}
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Fout bij analyse' }, { status: 500 });
  }
}
