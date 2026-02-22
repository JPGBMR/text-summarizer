#!/usr/bin/env python3
"""
Text Summarizer CLI

Automatic text summarization using TextRank and LSA algorithms.
"""
import click
import sys
from pathlib import Path

from src.summarizers import get_summarizer
from src.batch_processor import BatchProcessor


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """
    Text Summarizer - Automatic text summarization utility.

    Choose a command:

      summarize: Summarize a single text file

      batch: Batch process multiple files

      web: Launch web interface
    """
    pass


@cli.command()
@click.option(
    '--input', '-i',
    type=click.Path(exists=True, dir_okay=False),
    required=True,
    help='Input text file path'
)
@click.option(
    '--output', '-o',
    type=click.Path(dir_okay=False),
    help='Output file path (optional, prints to console if not specified)'
)
@click.option(
    '--algorithm', '-a',
    type=click.Choice(['textrank', 'lsa'], case_sensitive=False),
    default='textrank',
    help='Summarization algorithm to use'
)
@click.option(
    '--length', '-l',
    type=int,
    default=3,
    help='Number of sentences in summary'
)
def summarize(input, output, algorithm, length):
    """
    Summarize a single text file.

    Example:

      python main.py summarize -i input.txt -a textrank -l 5
    """
    try:
        # Read input file
        with open(input, 'r', encoding='utf-8') as f:
            text = f.read()

        if not text.strip():
            click.echo("Error: Input file is empty", err=True)
            sys.exit(1)

        # Generate summary
        click.echo(f"Summarizing with {algorithm.upper()}...")
        summarizer = get_summarizer(algorithm)
        summary = summarizer.summarize(text, length)

        # Output results
        if output:
            with open(output, 'w', encoding='utf-8') as f:
                f.write(summary)
            click.echo(f"✅ Summary saved to: {output}")
        else:
            click.echo("\n" + "="*50)
            click.echo("SUMMARY")
            click.echo("="*50)
            click.echo(summary)
            click.echo("="*50)
            click.echo(f"\nOriginal: {len(text.split())} words")
            click.echo(f"Summary: {len(summary.split())} words")

    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    '--input-dir', '-i',
    type=click.Path(exists=True, file_okay=False),
    required=True,
    help='Input directory containing .txt files'
)
@click.option(
    '--output-dir', '-o',
    type=click.Path(),
    required=True,
    help='Output directory for summaries'
)
@click.option(
    '--algorithm', '-a',
    type=click.Choice(['textrank', 'lsa'], case_sensitive=False),
    default='textrank',
    help='Summarization algorithm to use'
)
@click.option(
    '--length', '-l',
    type=int,
    default=3,
    help='Number of sentences in summary'
)
@click.option(
    '--recursive', '-r',
    is_flag=True,
    help='Process subdirectories recursively'
)
def batch(input_dir, output_dir, algorithm, length, recursive):
    """
    Batch process multiple text files.

    Example:

      python main.py batch -i ./docs -o ./summaries -a lsa -l 5 -r
    """
    try:
        processor = BatchProcessor(algorithm=algorithm, sentence_count=length)

        click.echo(f"Processing files in: {input_dir}")
        click.echo(f"Algorithm: {algorithm.upper()}")
        click.echo(f"Summary length: {length} sentences")
        click.echo("")

        report = processor.process_directory(
            input_dir,
            output_dir,
            recursive=recursive
        )

        click.echo("\n" + "="*50)
        click.echo("BATCH PROCESSING COMPLETE")
        click.echo("="*50)
        click.echo(f"Total files: {report['total_files']}")
        click.echo(f"Successful: {report['successful']}")
        click.echo(f"Failed: {len(report['failed'])}")

        if report['failed']:
            click.echo("\nFailed files:")
            for item in report['failed']:
                click.echo(f"  - {item['file']}: {item['error']}")

        click.echo(f"\n✅ Summaries saved to: {report['output_directory']}")

    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    '--host',
    default='0.0.0.0',
    help='Host to bind the server to'
)
@click.option(
    '--port',
    default=8000,
    type=int,
    help='Port to bind the server to'
)
def web(host, port):
    """
    Launch the web interface.

    Example:

      python main.py web --port 8000
    """
    try:
        import uvicorn
        from src.api.main import app

        click.echo("🚀 Starting Text Summarizer Web Interface...")
        click.echo(f"📍 Server running at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
        click.echo("Press CTRL+C to stop\n")

        uvicorn.run(app, host=host, port=port)

    except KeyboardInterrupt:
        click.echo("\n\n👋 Server stopped")
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()
